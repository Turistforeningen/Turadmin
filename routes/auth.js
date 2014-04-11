
/**
 * GET home page
 */

module.exports = function (app, options) {
    "use strict";

    var underscore = require('underscore');

    var client = options.dntConnect;

    var authenticate = function (req, res, next) {

        console.log('authenticate method start.');

        var nonSecurePaths = ['/images', '/javascripts', '/lib', '/scripts', '/stylesheets', '/upload', '/connect', '/login', '/restProxy'];

        if (underscore.contains(nonSecurePaths, underscore.first(req.path.match(/[^\/]*\/[^\/]*/)))) {
            // Path starts with a non-secure path
            console.log('A: ', req.path);
            next();

        } else {
            if (req.session.user && (req.session.user.er_autentisert === true)) {
                // User has a session and is authenticated
                console.log('I: ', req.path);
                console.log(req.session.user);
                next();
            } else {
                // User requests a secure path and is not authenticated. Redirect to login
                console.log('D: ', req.path);
                res.redirect('http://localhost:3000/login');
            }
        }
    };

    var getLogin = function (req, res) {
        // req.session.userId = "testUserId";
        res.render('login', { status: 'unid' });
    };

    var postLogin = function (req, res) {
        // console.log('postLogin');
        if (req && req.auth && req.auth.isAuthneticated) {
            // console.log('redirect /');
            res.redirect('/');
        } else {
            // console.log('redirect /connect');
            res.redirect(client.signon('http://localhost:3000/connect'));
        }
    };

    var getConnect = function (req, res) {
        // Check for ?data= query
        var data;
        if (req && req.query && req.query.data) {
            try {
                data = client.decryptJSON(req.query.data);
            } catch (e) {
                // @TODO handle this error propperly
                data = {er_autentisert: false};
            }

            // var userData = underscore.clone(data);
            req.session.user = userData;

            if (data.er_autentisert === true) {
                req.session.authType = 'dnt-connect';
                res.redirect('http://localhost:3000');
            } else {
                res.redirect(401, '/login?error=DNTC-503');
            }

      // Initiate DNT Connect signon
        } else {
            res.redirect(client.signon('http://localhost:3000/connect'));
        }
    };

    var getLogout = function (req, res) {
        console.log('Logging out...');
        console.log('Setting session to null...');
        req.session = null;
        console.log('Done!');
        console.log('session.user');
        console.log(req.session);
        res.redirect('/');
    };

    app.all('*', authenticate);
    app.get('/connect', getConnect);
    app.get('/login', getLogin);
    app.post('/login/dnt', postLogin);
    app.get('/logout', getLogout);

};

