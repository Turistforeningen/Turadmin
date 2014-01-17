
/**
 * Module dependencies.
 */

var express = require('express');
var http = require('http');
var path = require('path');
var restler = require('restler');
var app = express();

var apiUri = process.env.ROUTING_API_URL;


// all environments
app.set('port', process.env.PORT_WWW || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
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
var addRoute = require('./routes/addRoute')(app, {apiUri: apiUri});


http.createServer(app).listen(app.get('port'), function () {
    "use strict";
    console.log('Express server listening on port ' + app.get('port'));
});


app.all('/restProxy/*', function (req, res) {
    "use strict";
    var path = req.url;
    path = path.replace("restProxy/", "");
    var url = apiUri + path;
    console.log(url);
    restler.get(url, {

    }).on('complete', function (data) {
        console.log(data);
        res.json(data);
    });

});







