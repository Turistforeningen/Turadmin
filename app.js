
/**
 * Module dependencies.
 */

var express = require('express');
var path = require('path');
var restler = require('restler');
var app = module.exports = express();

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
    path = path.replace("apiProxy/?", "");
    var url = ntbApiUri + "?api_key=" + ntbApiKey + "&" + path;
    console.log(url);
    restler.get(url, {

    }).on('complete', function (data) {
        console.log(data);
        res.json(data);
    });

});