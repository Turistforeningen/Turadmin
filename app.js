/**
 * Module dependencies.
 */

var express = require('express');
var path = require('path');
var upload = require('jquery-file-upload-middleware');
var Connect = require('dnt-connect');

var app = module.exports = express();
var routeApiUri = process.env.ROUTING_API_URL;
var ntbApiUri = process.env.NTB_API_URL;
var ntbApiKey = process.env.NTB_API_KEY;
var dntConnectUser = process.env.DNT_CONNECT_USER;
var dntConnectKey = process.env.DNT_CONNECT_KEY;
var sessionSecret = process.env.SessionSecret || "1234SomeSecret";

// All environments
app.set('port', process.env.PORT_WWW || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev')); // this should be disabled during testing
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.cookieParser());
app.use(express.session({ secret: sessionSecret }));
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// Development only
app.configure('development', function () {
    "use strict";
    app.use(express.errorHandler({
        dumpExceptions: true,
        showStack: true
    }));
    app.set('view cache', false);
});

app.configure('production', function () {
    "use strict";
});

require('./routes')(app, { connect: new Connect(dntConnectUser, dntConnectKey) });

var fileManager = require('./routes/pictureUpload')(app, express, { dirname: __dirname });

var restProxy = require('./routes/restProxy')(app, {
    ntbApiUri: ntbApiUri,
    ntbApiKey: ntbApiKey,
    fileManager: fileManager
});

require('./routes/route')(app, restProxy, { routeApiUri: routeApiUri });
require('./routes/ssrProxy')(app, {});

// NOTE: Only listen for port if the application is not included by another module. Eg. the test runner.
if (!module.parent) {
    app.listen(app.get('port'), function () {
        "use strict";
        console.log('Express server listening on port ' + app.get('port'));
    });
}
