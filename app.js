if (process.env.NODE_ENV === 'production') {
  console.log('Starting newrelic application monitoring');
  require('newrelic');
}

/**
 * Set keys and URL's
 */

var routeApiUri = process.env.ROUTING_API_URL;
var ntbApiUri = process.env.NTB_API_URL;
var ntbApiKey = process.env.NTB_API_KEY;

var dntApiKey = process.env.DNT_CONNECT_KEY;

var sessionSecret = process.env.SESSION_SECRET || "0rdisObMCVXWawtji4B2iIGIKKqlsgAOPJhcHw4IREiCf7PGnAxY2isXfXd2Is7a";


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
app.set('port', process.env.APP_PORT || 8080);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json({extended: true, limit: '10mb'}));
app.use(methodOverride());
app.use(cookieParser(sessionSecret));
app.use(cookieSession({name: 'turadmin:sess', secret: sessionSecret}));
app.use(sentry.raven.middleware.express(sentry));
app.use(errorHandler({dumpExceptions: true, showStack: true}));
app.use('/', express.static(__dirname + '/public'));

app.disable('x-powered-by');
app.set('x-powered-by', false);
app.disable('etag');
app.set('etag', false);

if (app.get('env') === 'development') {
    app.set('view cache', false);
}

/**
 * Routes and middleware
 */

var restProxy = require('./routes/restProxy')(app, {ntbApiUri: ntbApiUri, ntbApiKey: ntbApiKey});
var userGroupsFetcher = require('./routes/userGroupsFetcher')(app, express, {api: new DNT('Turadmin/1.0', dntApiKey), restProxy: restProxy});

require('./routes/auth')(app, {
    dntApi: new DNT('Turadmin/1.0', dntApiKey),
    userGroupsFetcher: userGroupsFetcher
});

require('./routes/termsAndConditions')(app);

require('./routes/routes-index')(app, {
    dntApi: new DNT('Turadmin/1.0', dntApiKey),
    userGroupsFetcher: userGroupsFetcher,
    restProxy: restProxy
});

require('./routes/pois-index')(app, {
    dntApi: new DNT('Turadmin/1.0', dntApiKey),
    userGroupsFetcher: userGroupsFetcher,
    restProxy: restProxy
});

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

require('./routes/groups')(app, {
    dntApi: new DNT('Turadmin/1.0', dntApiKey),
    userGroupsFetcher: userGroupsFetcher,
    restProxy: restProxy
});

require('./routes/lists')(app, {
    dntApi: new DNT('Turadmin/1.0', dntApiKey),
    userGroupsFetcher: userGroupsFetcher,
    restProxy: restProxy
});

require('./routes/chown')(app, {
    dntApi: new DNT('Turadmin/1.0', dntApiKey),
    restProxy: restProxy
});

// Redirect requests to '/' to '/turer'
app.use('/', function (req, res, next) {
    "use strict";

    // We do not want to redirect requests for files or XHR's Could be replaced
    // with regexp matching all file extensions except html Also, this should be
    // in the route below, but did not get that to work, because this route also
    // caught requests for files and stuff
    var isFileRequest = !!req.url.match(/^.*\.(css|js|map)$/);
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

if (!module.parent) {
    app.listen(app.get('port'), function () {
        "use strict";
        console.log('Express server listening on port ' + app.get('port'));
    });
}
