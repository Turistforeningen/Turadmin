
/**
 * Module dependencies.
 */

var express = require('express');
var path = require('path');
var restler = require('restler');
var app = module.exports = express();
var util = require('util');

var routeApiUri = process.env.ROUTING_API_URL;
var ntbApiUri = process.env.NTB_API_URL;
var ntbApiKey = process.env.NTB_API_KEY;

// all environments
app.set('port', process.env.PORT_WWW || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev')); // this should be disable during testing
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' === app.get('env')) {
    app.use(express.errorHandler());
}

var routes = require('./routes')(app);
var addRoute = require('./routes/addRoute')(app, {routeApiUri: routeApiUri});

// Only listen for port if the application is not included by another module.
// Eg. the test runner.
if (!module.parent) {
    app.listen(app.get('port'), function () {
        "use strict";
        console.log('Express server listening on port ' + app.get('port'));
    });
}

app.all('/apiProxy/*', function (req, res) {
    "use strict";
    var path = req.url;
    path = path.replace("apiProxy/", "");
    var apiKey = "?api_key=" + ntbApiKey;
    var url = ntbApiUri + path;

    var onComplete = function (data) {
        console.log(data);
        res.json(data);
    };

    var onCompletePost = function (data) {
        data._id = data.document._id;
        console.log("id: " + data._id);
        res.json(data);
    };

    var method = req.method;
    if (method === "GET") {
        var getUrl = url + apiKey;
        console.log("getUrl = " + getUrl);
        restler.get(getUrl, {})
            .on('complete', onComplete);
    } else if (method === "POST") {
        var postUrl = url + apiKey;
        console.log("Posting: " + util.inspect(req.body));
        restler.postJson(postUrl, req.body)
            .on('complete', onCompletePost);
    } else if (method === "PUT") {
        var putUrl = url + apiKey;
        var json = JSON.stringify(req.body);
        console.log("putUrl = " + putUrl);
        console.log("Puting: " + json);
        restler.put(putUrl, {data: json})
            .on('complete', onComplete);
    }
});