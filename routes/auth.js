
/**
 * GET home page
 */

module.exports = function (app, options) {
    "use strict";

    var underscore = require('underscore');

    var client = options.dntConnect;

    var APP_URL = process.env.APP_URL;
    var WWW_PORT = process.env.WWW_PORT || null;
    var BASE_URL = APP_URL + (WWW_PORT !== null ? ':' + WWW_PORT : '');

    var authenticate = function (req, res, next) {

        var nonSecurePaths = ['/images', '/javascripts', '/lib', '/scripts', '/stylesheets', '/upload', '/connect', '/login', '/restProxy'];

        if (underscore.contains(nonSecurePaths, underscore.first(req.path.match(/[^\/]*\/[^\/]*/)))) {
            // Path starts with a non-secure path
            next();

        } else {
            if (req.session && req.session.user && (req.session.user.er_autentisert === true)) {
                // User has a session and is authenticated
                next();
            } else {
                // User requests a secure path and is not authenticated. Redirect to login
                res.redirect('/login');
            }
        }
    };

    var getLogin = function (req, res) {
        res.render('login', { status: 'unid' });
    };

    var postLogin = function (req, res) {
        // console.log('postLogin');
        if (req && req.auth && req.auth.isAuthneticated) {
            // console.log('redirect /');
            res.redirect('/');
        } else {
            // console.log('redirect /connect');
            res.redirect(client.signon(BASE_URL + '/connect'));
        }
    };

    var openid = require('openid');
    var relyingParty = new openid.RelyingParty(
        BASE_URL + '/login/nrk/verify', null, false, false, [
            new openid.AttributeExchange({
                "http://axschema.org/contact/email": "required",
                "http://axschema.org/namePerson/first": "required",
                "http://axschema.org/namePerson/last": "required"
            })
        ]
    );

    var getConnect = function (req, res) {
        // Check for ?data= query
        var data;
        if (req && req.query && req.query.data) {
            try {
                data = client.decrypt(req.query);
                if (data[1] === false) {
                    throw new Error('HMAC verification failed');
                }
                data = data[0]; // this is the user data
            } catch (e) {
                console.error(e);
                // @TODO handle this error properly
                data = {er_autentisert: false};
            }

            if (data.er_autentisert === true) {

                req.session.user = data;
                req.session.userId = data.sherpa_id;

                req.session.authType = 'dnt-connect';
                res.redirect('/');

            } else {
                res.redirect(401, '/login?error=DNTC-503');
            }

      // Initiate DNT Connect signon
        } else {
            res.redirect(client.signon('/'));
        }
    };

    var getLogout = function (req, res) {
        // console.log('Logging out...');
        // console.log('Setting session to null...');
        req.session = null;
        // console.log('Done!');
        // console.log('session.user');
        // console.log(req.session);
        res.redirect('/');
    };

    app.all('*', authenticate);
    app.get('/connect', getConnect);
    app.get('/login', getLogin);
    app.post('/login/dnt', postLogin);
    app.get('/logout', getLogout);

};

