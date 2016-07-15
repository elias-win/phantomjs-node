'use strict';

const ASYNC_METHODS = [
    'includeJs',
    'open'
];

const METHODS = [
    'addCookie',
    'clearCookies',
    'close',
    'deleteCookie',
    'evaluate',
    'evaluateJavaScript',
    'injectJs',
    'openUrl',
    'reload',
    'render',
    'renderBase64',
    'sendEvent',
    'setContent',
    'stop',
    'switchToFrame',
    'switchToMainFrame'
];

function Page(phantom, id) {
    this.phantom = phantom;
    this.id = id;
}

Page.prototype.execute = function (name, args) {
    return this.phantom.execute(this.id, name, args);
};

Page.prototype.invokeAsyncMethod = function () {
    return this.execute('invokeAsyncMethod', [].slice.call(arguments));
};

Page.prototype.invokeMethod = function () {
    return this.execute('invokeMethod', [].slice.call(arguments));
};

Page.prototype.on = function (event, listener) {
    return this.phantom.on(this.id, event, listener);
};

Page.prototype.property = function () {
    return this.execute('property', [].slice.call(arguments));
};

Page.prototype.setting = function () {
    return this.execute('setting', [].slice.call(arguments));
};

ASYNC_METHODS.forEach(function (method) {
    Page.prototype[method] = function () {
        return this.invokeAsyncMethod.apply(this, [method].concat([].slice.call(arguments)));
    };
});

METHODS.forEach(function (method) {
    Page.prototype[method] = function () {
        return this.invokeMethod.apply(this, [method].concat([].slice.call(arguments)));
    };
});

module.exports = Page;