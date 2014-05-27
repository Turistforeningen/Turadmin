/**
 * Module dependencies.
 */

var routeApiUri = process.env.ROUTING_API_URL;
var ntbApiUri = process.env.NTB_API_URL;
var ntbApiKey = process.env.NTB_API_KEY;

var dntConnectUser = process.env.DNT_CONNECT_USER;
var dntConnectKey = process.env.DNT_CONNECT_KEY;

var dntApiKey = process.env.DNT_CONNECT_KEY;

var express = require('express');
var path = require('path');
var upload = require('jquery-file-upload-middleware');
var Connect = require('dnt-connect');
var DNT = require('dnt-api');

var app = module.exports = express();

var userGroupsFetcher = require('./routes/userGroupsFetcher')(app, express, {api: new DNT('Turadmin/1.0', dntApiKey)});

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
app.use(express.cookieParser(sessionSecret));
app.use(express.cookieSession()); // NOTE: Replaced app.use(express.session({ secret: sessionSecret }));
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

require('./routes/auth')(app, {dntConnect: new Connect(dntConnectUser, dntConnectKey)});
require('./routes')(app, {
    dntConnect: new Connect(dntConnectUser, dntConnectKey),
    dntApi: new DNT('Turadmin/1.0', dntApiKey),
    userGroupsFetcher: userGroupsFetcher
});

require('./routes/termsAndConditions')(app, {dntConnect: new Connect(dntConnectUser, dntConnectKey)});

// var fileManager = require('./routes/pictureUpload')(app, express, { dirname: __dirname });
var pictureFileManager = require('./routes/pictureUpload')(app, express, { dirname: __dirname });
var gpxFileManager = require('./routes/gpxUpload')(app, express, { dirname: __dirname });

var restProxy = require('./routes/restProxy')(app, {ntbApiUri: ntbApiUri, ntbApiKey: ntbApiKey, pictureFileManager: pictureFileManager});

require('./routes/route')(app, restProxy, { routeApiUri: routeApiUri, dntApi: new DNT('Turadmin/1.0', dntApiKey), userGroupsFetcher: userGroupsFetcher });
require('./routes/ssrProxy')(app, {});

// NOTE: Only listen for port if the application is not included by another module. Eg. the test runner.
if (!module.parent) {
    app.listen(app.get('port'), function () {
        "use strict";
        console.log('Express server listening on port ' + app.get('port'));
    });
}
