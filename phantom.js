'use strict';

const EventEmitter = require('events');
const http = require('http');
const Page = require('./page');
const path = require('path');
const phantomjs = require('phantomjs-prebuilt');
const Q = require('q');
const spawn = require('child_process').spawn;

const DRIVER = path.join(__dirname, 'driver.js');

function createDriver(port, args) {
  return spawn(phantomjs.path, args.concat([
    DRIVER,
    port
  ]));
}

function Phantom(port, args) {
  this.port = port || 3000;
  this.args = args || [];
  this.emitters = new Map();
}

Phantom.prototype.createPage = function () {
  return this.execute('phantom', 'createPage').then((id) => {
    return new Page(this, id);
  });
};

Phantom.prototype.execute = function (scope, name, args) {
  return this.executeCommand({
    scope: scope,
    name: name,
    args: args
  });
}

Phantom.prototype.executeCommand = function (command) {
  let content = JSON.stringify(command, (key, val) => {
    if (typeof val === 'function') {
      return val.toString();
    }
    return val;
  });
  let options = {
    headers: {
      'Content-Length': Buffer.byteLength(content)
    },
    host: '127.0.0.1',
    method: 'POST',
    path: '/',
    port: this.port
  };
  let promise = Q.defer();
  let request = http.request(options, function (response) {
    let body = '';
    response.setEncoding('utf8');
    response.on('data', (data) => {
      body += data;
    });
    response.on('end', () => {
      if (body === '') {
        return promise.resolve(undefined);
      }
      let json;
      try {
        json = JSON.parse(body);
      } catch (error) {
        return promise.reject(error);
      }
      promise.resolve(json);
    });
  });
  request.on('error', promise.reject);
  request.write(content);
  request.end();
  return promise.promise;
};

Phantom.prototype.on = function (scope, event, listener) {
  if (!this.emitters[scope]) {
    this.emitters[scope] = new EventEmitter();
  }
  this.emitters[scope].on(event, listener);
};

Phantom.prototype.property = function () {
  return this.execute('phantom', 'property', [].slice.call(arguments));
};

Phantom.prototype.start = function () {
  let promise = Q.defer();
  this.driver = createDriver(this.port, this.args);
  this.driver.stdout.setEncoding('utf8');
  this.driver.stdout.on('data', (data) => {
    let json;
    try {
      json = JSON.parse(data);
    } catch (error) {
      return;
    }
    if (json.hasOwnProperty('listening')) {
      if (json['listening']) {
        promise.resolve();
      } else {
        promise.reject();
      }
    }
    if (json.hasOwnProperty('event')) {
      let event = json['event'];
      if (this.emitters[event.scope]) {
        this.emitters[event.scope].emit.apply(this.emitters[event.scope], [event.event].concat(event.args));
      }
    }
  });
  return promise.promise;
};

Phantom.prototype.kill = function () {
  this.driver.kill();
};

module.exports = Phantom;