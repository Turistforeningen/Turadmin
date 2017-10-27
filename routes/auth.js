/*
 * Copyright (c) $year, Den Norske Turistforening (DNT)
 *
 * https://github.com/Turistforeningen/turadmin
 */

var sentry = require('../lib/sentry');

module.exports = function (app, options) {
    "use strict";

    var underscore = require('underscore');
    var Connect = require('dnt-connect');
    var TurbasenAuth = require('turbasen-auth');

    var dntConnectClient = new Connect(process.env.DNT_CONNECT_USER, process.env.DNT_CONNECT_KEY);
    var turbasenAuthClient = new TurbasenAuth('Turadmin', process.env.NTB_API_KEY, {env: process.env.NTB_API_ENV || 'dev'});
    var userGroupsFetcher = options.userGroupsFetcher;

    var BASE_URL = app.get('url');

    var authenticate = function (req, res, next) {

        var nonSecurePaths = ['/images', '/javascripts', '/lib', '/scripts', '/stylesheets', '/upload', '/connect', '/login', '/restProxy'];

        if (underscore.contains(nonSecurePaths, underscore.first(req.path.match(/[^\/]*\/[^\/]*/)))) {
            // Path starts with a non-secure path
            next();

        } else {
            if (req.session && req.session.isAuthenticated === true) {
                // User has a session and is authenticated
                next();
            } else {
                // User requests a secure path and is not authenticated. Redirect to login
                res.redirect('/login');
            }
        }
    };

    var getLogin = function (req, res, next) {
        if (req.session && req.session.isAuthenticated === true) {
            res.redirect('/');
        } else {
            var options = {error: req.query.error, title: 'Logg inn'};
            res.render('login', options);
        }
    };

    var getLoginDntConnect = function (req, res) {
        if (req && req.auth && req.auth.isAuthenticated) {
            res.redirect('/');
        } else {
            res.redirect(dntConnectClient.signon(BASE_URL + '/login/dnt/verify'));
        }
    };

    var getLoginDntVerify = function (req, res) {
        // Check for ?data= query
        var data;
        if (req && req.query && req.query.data) {
            try {
                data = dntConnectClient.decrypt(req.query);
                if (data[1] === false) {
                    throw new Error('HMAC verification failed');
                }
                data = data[0]; // this is the user data
            } catch (e) {
                sentry.captureError(e, { extra: { query: req.query }});
                data = {er_autentisert: false};
            }

            if (data.er_autentisert === true) {
                req.session.isAuthenticated = true;
                req.session.authType = 'dnt-connect';

                req.session.user = data;
                req.session.user.provider = 'DNT Connect';
                req.session.user._id = 'sherpa3:' + data.sherpa_id;
                req.session.userId = 'sherpa3:' + data.sherpa_id;
                res.redirect('/');

            } else {
                sentry.captureMessage('DNT Connect verification failed', { extra: { data: data }});
                res.redirect(401, '/login?error=DNTC-503');
            }

        // Initiate DNT Connect signon
        } else {
            res.redirect(dntConnectClient.signon('/'));
        }
    };

    var getLoginTurbasenAuth = function (req, res) {
        res.redirect('/login');
    };

    var postLoginTurbasenAuth = function (req, res) {
        turbasenAuthClient.authenticate(req.body.username, req.body.password, function (error, user) {
            if (error) {
                // Something went horribly wrong
                sentry.captureError(error, {extra: { username: req.body.username}});

            } else if (user) {
                req.session.isAuthenticated = true;
                req.session.authType = 'innholdspartner';

                req.session.user = user;
                req.session.user._id = user.gruppe._id;
                req.session.user.provider = 'Innholdspartner';

                req.session.userId = user.epost;
                res.redirect('/');

            } else {
                sentry.captureMessage('Turbasen Auth verification failed', { extra: { username: req.body.username }});
                res.redirect('/login?error=TBAUTH-401');
            }
        });
    };

    var getLogout = function (req, res) {
        req.session = null;

        if (req.query.next) {
            res.redirect(req.query.next);
        } else {
            res.redirect('/');
        }
    };

    app.all('*', authenticate);
    app.get('*', userGroupsFetcher);
    app.get('/login/dnt/connect', getLoginDntConnect);
    app.get('/login/dnt/verify', getLoginDntVerify);
    app.get('/login/turbasen', getLoginTurbasenAuth);
    app.post('/login/turbasen', postLoginTurbasenAuth);
    app.get('/login', getLogin);
    app.get('/logout', getLogout);

};
