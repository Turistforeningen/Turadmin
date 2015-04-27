/**
 * Set keys and URL's
 */

var routeApiUri = process.env.ROUTING_API_URL;
var ntbApiUri = process.env.NTB_API_URL;
var ntbApiKey = process.env.NTB_API_KEY;

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
var DNT = require('dnt-api');
var sentry = require('./lib/sentry');

// Start app
var app = module.exports = express();

// All environments
app.set('url', process.env.APP_URL);
app.set('port', process.env.PORT_WWW || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json({extended: true}));
app.use(methodOverride());
app.use(cookieParser(sessionSecret));
app.use(cookieSession({name: 'turadmin:sess', secret: sessionSecret}));
app.use(sentry.raven.middleware.express(sentry));

/**
 * Configure environments
 */
if (app.get('env') === 'development') {
    // Development only
    app.set('view cache', false);
    app.set('url', process.env.APP_URL + ':' + app.get('port'));

} else if (app.get('env') === 'production') {
    // Production only
}

app.use(require('morgan')('dev'));
app.use(errorHandler({
    dumpExceptions: true,
    showStack: true
}));


/**
 * Routes and middleware
 */

var userGroupsFetcher = require('./routes/userGroupsFetcher')(app, express, {api: new DNT('Turadmin/1.0', dntApiKey)});

require('./routes/auth')(app);

require('./routes/termsAndConditions')(app);

require('./routes/routes-index')(app, {
    dntApi: new DNT('Turadmin/1.0', dntApiKey),
    userGroupsFetcher: userGroupsFetcher
});

require('./routes/pois-index')(app, {
    dntApi: new DNT('Turadmin/1.0', dntApiKey),
    userGroupsFetcher: userGroupsFetcher
});

var restProxy = require('./routes/restProxy')(app, {ntbApiUri: ntbApiUri, ntbApiKey: ntbApiKey});

require('./routes/route')(app, restProxy, {
    routeApiUri: routeApiUri,
    dntApi: new DNT('Turadmin/1.0', dntApiKey),
    userGroupsFetcher: userGroupsFetcher
});

require('./routes/poi')(app, restProxy, {
    routeApiUri: routeApiUri,
    dntApi: new DNT('Turadmin/1.0', dntApiKey),
    userGroupsFetcher: userGroupsFetcher
});

require('./routes/ssrProxy')(app, {});

// NOTE: Only listen for port if the application is not included by another module. Eg. the test runner.
if (!module.parent) {
    app.listen(app.get('port'), function () {
        "use strict";
        console.log('Express server listening on port ' + app.get('port'));
    });
}

// Redirect requests to '/' to '/turer'
app.use('/', function (req, res, next) {

    // We do not want to redirect requests for files or XHR's
    // Could be replaced with regexp matching all file extensions except html
    // Also, this should be in the route below, but did not get that to work,
    // because this route also caught requests for files and stuff
    var isFileRequest = !!req.url.match(/^.*\.(css|js)$/);
    var isXhr = req.xhr;

    if (isFileRequest || isXhr) {
        res.status(404).end();

    } else {
        res.redirect(301, '/turer');
    }

});

// 404 handling
// Redirect requests for invalid URL's to /
app.use(function (req, res, next) {
    "use strict";

    res.redirect(307, '/');
});
