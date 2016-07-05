'use strict';

const Page = require('../page');
const Phantom = require('../phantom');

describe('Phantom', function () {
    let phantom;

    beforeEach(function (done) {
        phantom = new Phantom(3000);
        phantom.start().then(done);
    });

    afterEach(function () {
        phantom.kill();
    });

    it('#createPage() creates a Page', function (done) {
        phantom.createPage().then(function (page) {
            expect(page).toEqual(jasmine.any(Page));
            done();
        });
    });

    it('#property(\'cookiesEnabled\') returns the property', function (done) {
        phantom.property('cookiesEnabled').then(function (cookiesEnabled) {
            expect(cookiesEnabled).toBe(true);
            done();
        });
    });

    it('#property(\'cookiesEnabled\', false) sets the property', function (done) {
        phantom.property('cookiesEnabled', false).then(function () {
            return phantom.property('cookiesEnabled');
        }).then(function (cookiesEnabled) {
            expect(cookiesEnabled).toBe(false);
            done();
        });
    });
});