'use strict';

const fs = require('fs');
const http = require('http');
const Phantom = require('../phantom');

describe('Page', function () {
    let phantom;
    let port;
    let server;

    beforeAll(function () {
        server = http.createServer(function (request, response) {
            if (request.url === '/script.js') {
                response.writeHead(200, {
                    'Content-Type': 'text/javascript'
                });
                response.end('window.secret = "Hello, world!";');
            } else {
                response.writeHead(200, {
                    'Content-Type': 'text/html'
                });
                response.end('<html><head><title>This is the title!</title></head><body>This is the body!</body></html>');
            }
        }).listen();

        port = server.address().port;
    });

    afterAll(function () {
        server.close();
    });

    beforeEach(function (done) {
        phantom = new Phantom(3000);
        phantom.start().then(done);
    });

    afterEach(function () {
        phantom.kill();
    });

    it('#addCookie() adds a cookie', function (done) {
        let page;
        phantom.createPage().then(function (instance) {
            page = instance;
            return page.addCookie({
                'name': 'Valid-Cookie-Name',
                'value': 'Valid-Cookie-Value',
                'domain': 'localhost',
                'path': '/',
                'httponly': true,
                'secure': false,
                'expires': (new Date()).getTime() + (1000 * 60 * 60)
            });
        }).then(function () {
            return page.property('cookies');
        }).then(function (cookies) {
            expect(cookies.length).toEqual(1);
            done();
        });
    });

    it('#clearCookies() clear the cookies', function (done) {
        let page;
        phantom.createPage().then(function (instance) {
            page = instance;
            return page.addCookie({
                'name': 'Valid-Cookie-Name',
                'value': 'Valid-Cookie-Value',
                'domain': 'localhost',
                'path': '/',
                'httponly': true,
                'secure': false,
                'expires': (new Date()).getTime() + (1000 * 60 * 60)
            });
        }).then(function () {
            return page.clearCookies();
        }).then(function () {
            return page.property('cookies');
        }).then(function (cookies) {
            expect(cookies.length).toEqual(0);
            done();
        });
    });

    it('#deleteCookie() deletes a cookie', function (done) {
        let page;
        phantom.createPage().then(function (instance) {
            page = instance;
            return page.addCookie({
                'name': 'Valid-Cookie-Name',
                'value': 'Valid-Cookie-Value',
                'domain': 'localhost',
                'path': '/',
                'httponly': true,
                'secure': false,
                'expires': (new Date()).getTime() + (1000 * 60 * 60)
            });
        }).then(function () {
            return page.deleteCookie('Valid-Cookie-Name');
        }).then(function () {
            return page.property('cookies');
        }).then(function (cookies) {
            expect(cookies.length).toEqual(0);
            done();
        });
    });

    it('#evaluate() evaluates a function', function (done) {
        phantom.createPage().then(function (page) {
            return page.evaluate(function (a, b) {
                return a + b;
            }, 10, 10);
        }).then(function (sum) {
            expect(sum).toEqual(20);
            done();
        });
    });

    it('#evaluateJavaScript() evaluates a serialized function', function (done) {
        phantom.createPage().then(function (page) {
            return page.evaluateJavaScript('function(){return "Hello, world!";}');
        }).then(function (result) {
            expect(result).toEqual('Hello, world!');
            done();
        });
    });

    it('#includeJs() includes a JavaScript path', function (done) {
        let page;
        phantom.createPage().then(function (instance) {
            page = instance;
            return page.includeJs(`http://127.0.0.1:${port}/script.js`);
        }).then(function () {
            return page.evaluate(function () {
                return window.secret;
            });
        }).then(function (secret) {
            expect(secret).toEqual('Hello, world!');
            done();
        });
    });

    it('#injectJs()', function (done) {
        let page;
        phantom.createPage().then(function (instance) {
            page = instance;
            return page.injectJs(__dirname + '/script.js');
        }).then(function () {
            return page.evaluate(function () {
                return window.secret;
            });
        }).then(function (secret) {
            expect(secret).toEqual('Hello, world!');
            done();
        });
    });

    it('#invokeAsyncMethod() invokes an asynchronous method', function (done) {
        phantom.createPage().then(function (page) {
            return page.invokeAsyncMethod('open', `http://127.0.0.1:${port}/`);
        }).then(function (status) {
            expect(status).toEqual('success');
            done();
        });
    });

    it('#invokeMethod() invokes a method', function (done) {
        phantom.createPage().then(function (page) {
            return page.invokeMethod('evaluate', function (a, b) {
                return a + b;
            }, 10, 10);
        }).then(function (sum) {
            expect(sum).toEqual(20);
            done();
        });
    });

    it('#open() opens a URL', function (done) {
        phantom.createPage().then(function (page) {
            return page.open(`http://127.0.0.1:${port}/`);
        }).then(function (status) {
            expect(status).toEqual('success');
            done();
        });
    });

    it('#openUrl() opens a URL', function (done) {
        phantom.createPage().then(function (page) {
            page.on('onLoadFinished', function (status) {
                expect(status).toEqual('success');
                done();
            });
            page.openUrl(`http://127.0.0.1:${port}/`, 'GET', {});
        });
    });

    it('#reload() reloads the page', function (done) {
        let page;
        phantom.createPage().then(function (instance) {
            page = instance;
            return page.open(`http://127.0.0.1:${port}/`);
        }).then(function () {
            page.on('onNavigationRequested', function (url, type) {
                expect(type).toEqual('Reload');
                done();
            });
            page.reload();
        });
    });

    it('#render() renders the page', function (done) {
        let path = 'frame.png';
        phantom.createPage().then(function (page) {
            return page.render(path);
        }).then(function () {
            expect(function () {
                fs.accessSync(path, fs.F_OK);
            }).not.toThrow();
            fs.unlinkSync(path);
            done();
        });
    });

    it('#renderBase64() renders the page', function (done) {
        phantom.createPage().then(function (page) {
            return page.renderBase64('PNG');
        }).then(function (data) {
            expect(data).not.toBeNull();
            done();
        });
    });

    it('#property(\'zoomFactor\', 0.5) sets the property', function (done) {
        let page;
        phantom.createPage().then(function (instance) {
            page = instance;
            return page.property('zoomFactor', 0.5);
        }).then(function () {
            return page.property('zoomFactor');
        }).then(function (zoomFactor) {
            expect(zoomFactor).toEqual(0.5);
            done();
        });
    });

    it('#property(\'zoomFactor\') returns the property', function (done) {
        phantom.createPage().then(function (page) {
            return page.property('zoomFactor');
        }).then(function (zoomFactor) {
            expect(zoomFactor).toEqual(1);
            done();
        });
    });

    it('#setContent() sets the content', function (done) {
        let page;
        phantom.createPage().then(function (instance) {
            page = instance;
            return page.setContent('<html><head><title>This is the title!</title></head></html>', `http://127.0.0.1:${port}/`);
        }).then(function () {
            return page.evaluate(function () {
                return document.title;
            });
        }).then(function (title) {
            expect(title).toEqual('This is the title!');
            done();
        });
    });

    it('#switchToFrame() switches to a frame', function (done) {
        let page;
        phantom.createPage().then(function (instance) {
            page = instance;
            return page.setContent(`<html><body><iframe id="frame" src="http://127.0.0.1:${port}/"></iframe></body></html>`, `http://127.0.0.1:${port}/`);
        }).then(function () {
            return page.switchToFrame(0);
        }).then(function () {
            return page.evaluate(function () {
                return window.frameElement.id;
            });
        }).then(function (id) {
            expect(id).toEqual('frame');
            done();
        });
    });

    it('#switchToMainFrame() switches to the main frame', function (done) {
        let page;
        phantom.createPage().then(function (instance) {
            page = instance;
            return page.setContent(`<html><body><iframe id="frame" src="http://127.0.0.1:${port}/"></iframe></body></html>`, `http://127.0.0.1:${port}/`);
        }).then(function () {
            return page.switchToFrame(0);
        }).then(function () {
            return page.switchToMainFrame();
        }).then(function () {
            return page.evaluate(function () {
                return window.frameElement === null;
            });
        }).then(function (notInFrame) {
            expect(notInFrame).toBe(true);
            done();
        });
    });

    it('#on() adds an event listener', function (done) {
        let page;
        phantom.createPage().then(function (instance) {
            page = instance;
            page.on('onLoadFinished', function (status) {
                expect(status).toEqual('success');
                done();
            });
            page.open(`http://127.0.0.1:${port}/`);
        });
    });
});
