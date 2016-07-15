'use strict';

var webpage = require('webpage');
var server = require('webserver').create();
var system = require('system');
var Q = require('q');

var COMMANDS = {
  'createPage': function (object, command) {
    var page = webpage.create();
    var id = scopeCounter++;
    PAGE_EVENTS.forEach(function (event) {
      page[event] = function () {
        emitEvent({
          args: [].slice.call(arguments),
          event: event,
          scope: id
        });
      };
    });
    scopes[id] = page;
    return id;
  },
  'invokeAsyncMethod': function (object, command) {
    var promise = Q.defer();
    object[command.args[0]].apply(object, command.args.slice(1).concat(promise.resolve));
    return promise.promise;
  },
  'invokeMethod': function (object, command) {
    return object[command.args[0]].apply(object, command.args.slice(1));
  },
  'property': function (object, command) {
    if (command.args.length > 1) {
      object[command.args[0]] = command.args[1];
    }
    return object[command.args[0]];
  },
  'setting': function (object, command) {
    if (command.args.length > 1) {
      object.settings[command.args[0]] = command.args[1];
    }
    return object.settings[command.args[0]];
  }
};

var PAGE_EVENTS = [
  'onAlert',
  'onCallback',
  'onClosing',
  'onConfirm',
  'onConsoleMessage',
  'onError',
  'onFilePicker',
  'onInitialized',
  'onLoadFinished',
  'onLoadStarted',
  'onNavigationRequested',
  'onPageCreated',
  'onPrompt',
  'onResourceError',
  'onResourceReceived',
  'onResourceRequested',
  'onResourceTimeout',
  'onUrlChanged'
];

var scopeCounter = 0;

var scopes = {
  'phantom': phantom
};

function emitEvent(event) {
  console.log(JSON.stringify({
    event: event
  }));
}

function execute(command) {
  return Q.fcall(COMMANDS[command.name].bind(null, scopes[command.scope], command));
}

var listening = server.listen(system.args[1], function (request, response) {
  var command;
  if (request.method === 'POST') {
    try {
      command = JSON.parse(request.post, function (key, val) {
        if (typeof val === 'string') {
          var match = val.match(/^function\s*\((.*?)\)\s*\{([\s\S]*)\}$/);
          if (match) {
            return new Function(match[1], match[2]);
          }
        }
        return val;
      });
    } catch (exception) {
      response.statusCode = 400;
      response.write(JSON.stringify(exception));
      response.close();
      return;
    }
    execute(command).then(function (value) {
      response.statusCode = 200;
      response.write(JSON.stringify(value));
      response.close();
    }).catch(function (error) {
      response.statusCode = 500;
      response.write(JSON.stringify(error));
      response.close();
    });
  } else {
    response.statusCode = 405;
    response.close();
  }
});

console.log(JSON.stringify({
  listening: listening
}));