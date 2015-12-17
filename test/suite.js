var assert = require('assert');
var request = require('supertest');

var app = null;
var req = null;

before(function () {
    "use strict";
    this.timeout(10000);
    app = require('../app.js');
    req = request(app);
});

describe('/', function () {
    "use strict";
    it('should be able to start the server without crashing', function (done) {
        this.timeout(10000);
        req.get('/').expect(302, done);
    });
});
