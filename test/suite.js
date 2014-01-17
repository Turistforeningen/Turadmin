var assert = require('assert');
var request = require('supertest');

var app = null;
var req = null;

before(function() {
  app = require('../app.js');
  req = request(app);
});

describe('/', function() {
  it('should be able to start the server without crashing', function(done) {
    req.get('/').expect(200).end(function(err, res) {
      assert.ifError(err);
      done()
    });
  });
});

