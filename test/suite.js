var assert = require('assert');
var request = require('supertest');

var app = null;
var req = null;

before(function () {
    "use strict";
    app = require('../app.js');
    req = request(app);
});

describe('/', function () {
    "use strict";
    it('should be able to start the server without crashing', function (done) {
        req.get('/').expect(302, done);
    });
});

