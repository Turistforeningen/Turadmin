/**
 * Set keys and URL's
 */

var routeApiUri = process.env.ROUTING_API_URL;
var ntbApiUri = process.env.NTB_API_URL;
var ntbApiKey = process.env.NTB_API_KEY;

var dntConnectUser = process.env.DNT_CONNECT_USER;
var dntConnectKey = process.env.DNT_CONNECT_KEY;

var dntApiKey = process.env.DNT_CONNECT_KEY;

var sessionSecret = process.env.SessionSecret || "0rdisObMCVXWawtji4B2iIGIKKqlsgAOPJhcHw4IREiCf7PGnAxY2isXfXd2Is7a";


/**
 * Module dependencies
 */

var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var errorHandler = require('errorhandler');
var cookieSession = require('cookie-session');
var methodOverride = require('method-override');
var favicon = require('serve-favicon');
var morgan = require('morgan'); // previously logger
var upload = require('jquery-file-upload-middleware');
var Connect = require('dnt-connect');
var DNT = require('dnt-api');


// Start app
var app = module.exports = express();

// All environments
app.set('url', process.env.APP_URL);
app.set('port', process.env.PORT_WWW || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(morgan('dev')); // this should be disabled during testing
app.use(bodyParser());
app.use(methodOverride());
app.use(cookieParser(sessionSecret));
app.use(cookieSession({name: 'turadmin:sess', secret: sessionSecret}));
app.use(express.static(path.join(__dirname, 'public')));


/**
 * Configure environments
 */
if (app.get('env') === 'development') {
    // Development only
    app.use(errorHandler({
        dumpExceptions: true,
        showStack: true
    }));
    app.set('view cache', false);
    app.set('url', process.env.APP_URL + ':' + app.get('port'));

} else if (app.get('env') === 'production') {}

/**
 * Routes and middleware
 */

var userGroupsFetcher = require('./routes/userGroupsFetcher')(app, express, {api: new DNT('Turadmin/1.0', dntApiKey)});

require('./routes/auth')(app, {dntConnect: new Connect(dntConnectUser, dntConnectKey)});

require('./routes/termsAndConditions')(app, {dntConnect: new Connect(dntConnectUser, dntConnectKey)});

require('./routes')(app, {
    dntConnect: new Connect(dntConnectUser, dntConnectKey),
    dntApi: new DNT('Turadmin/1.0', dntApiKey),
    userGroupsFetcher: userGroupsFetcher
});


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
