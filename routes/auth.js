/*
 * Copyright (c) $year, Den Norske Turistforening (DNT)
 *
 * https://github.com/Turistforeningen/turadmin
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
            if (req.session && req.session.isAuthneticated === true) {
                // User has a session and is authenticated
                next();
            } else {
                // User requests a secure path and is not authenticated. Redirect to login
                res.redirect('/login');
            }
        }
    };

    var getLogin = function (req, res, next) {
        if (req.session && req.session.isAuthneticated === true) {
            res.redirect('/');
        } else {
            res.render('login');
        }
    };

    var postLogin = function (req, res) {
        if (req && req.auth && req.auth.isAuthneticated) {
            res.redirect('/');
        } else {
            res.redirect(client.signon(BASE_URL + '/connect'));
        }
    };

    var openid = require('openid');
    var relyingParty = new openid.RelyingParty(
        BASE_URL + '/login/nrk/verify', null, true, false, [
            new openid.AttributeExchange({
                "http://axschema.org/contact/email": "required",
                "http://axschema.org/namePerson/first": "required",
                "http://axschema.org/namePerson/last": "required"
            })
        ]
    );

    var getLoginNrkBounce = function (req, res, next) {
        relyingParty.authenticate('http://mitt.nrk.no/user.aspx', false, function (err, authUrl) {
            if (err) { return next(err); }
            if (!authUrl) { return next(new Error('Unable to aquire OpenID auth URL')); }
            res.redirect(301, authUrl);
        });
    };

    var getLoginNrkVerify = function (req, res, next) {
        relyingParty.verifyAssertion(req, function(err, result) {

            if (err) { console.log(err); return next(err); }

            if (result.authenticated === true) {
                req.session.isAuthneticated = true;
                req.session.authType = 'mitt-nrk';

                req.session.user = {
                    _id: result.claimedIdentifier,
                    epost: decodeURIComponent(result['http://axschema.org/contact/email']),
                    fornavn: decodeURIComponent(result['http://axschema.org/namePerson/first']),
                    etternavn: decodeURIComponent(result['http://axschema.org/namePerson/last']),
                    provider: 'Mitt NRK'
                };

                req.session.userId = result.claimedIdentifier;
                res.redirect('/');
            } else {
                // @TODO handle this error in view
                res.redirect(401, '/login?error=MITTNRK-503');
            }
        });
    };

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
                req.session.isAuthneticated = true;
                req.session.authType = 'dnt-connect';

                req.session.user = data;
                req.session.user.provider = 'DNT Connect';
                req.session.user._id = data.sherpa_id;
                req.session.userId = data.sherpa_id;
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
        req.session = null;
        res.redirect('/');
    };

    app.all('*', authenticate);
    app.get('/login/nrk/bounce', getLoginNrkBounce);
    app.get('/login/nrk/verify', getLoginNrkVerify);
    app.get('/connect', getConnect);
    app.get('/login', getLogin);
    app.post('/login/dnt', postLogin);
    app.get('/logout', getLogout);

};
