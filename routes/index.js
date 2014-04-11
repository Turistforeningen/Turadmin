
/**
 * GET home page
 */

module.exports = function (app, options) {
    "use strict";

    var underscore = require('underscore');

    var client = options.dntConnect;
    var api = options.dntApi;

    var authenticate = function (req, res, next) {

        var nonSecurePaths = ['/images', '/javascripts', '/lib', '/scripts', '/stylesheets', '/upload', '/connect', '/login', '/restProxy'];

        if (underscore.contains(nonSecurePaths, underscore.first(req.path.match(/[^\/]*\/[^\/]*/)))) {
            console.log('A: ', req.path);
            next();

        } else {
            if (req.session.user && (req.session.user.er_autentisert === true)) {
                console.log('I: ', req.path);
                console.log(req.session.user);
                next();
            } else {
                console.log('D: ', req.path);
                res.redirect('http://localhost:3000/login');
            }
        }
    };

    // var authenticate = function (req, res, next) {

    //     if (underscore.contains(nonSecurePaths, underscore.first(req.path.match(/[^\/]*\/[^\/]*/)))) {
    //         // console.log('A: ', req.path);
    //         next();

    //     } else {
    //         // console.log('D: ', req.path);
    //         if (req.session.user && (req.session.user.er_autentisert === true)) {
    //             next();
    //         } else {
    //             res.redirect('http://localhost:3000/login');
    //         }
    //     }
    // };

    /**
     * GET list of routes (index page)
     */
    var getIndex = function (req, res) {

        var userGroups = [];

        api.getAssociationsFor({ bruker_sherpa_id: 30835 }, function(err, statusCode, associations) {
            if (err) { throw err }
            if (statusCode === 200) {

                for (var i = 0; i < associations.length; i++) {
                    // console.log('Member is associated with ' + associations[i].navn);
                    userGroups.push(associations[i]);
                }

                res.render('index', {
                    title: 'Mine turer',
                    userData: JSON.stringify(req.session.user),
                    userGroups: JSON.stringify(userGroups),
                    authType: req.session.authType
                });

            } else {
                console.error('Request failed! HTTP status code returned is ' + statusCode);
                console.error(associations.errors);
            }
        });

        // if (req.session.user && (req.session.user.er_autentisert === true)) {
        //     res.render('index', {
        //         title: 'Mine turer',
        //         userData: JSON.stringify(req.session.user),
        //         userGroups: JSON.stringify(userGroups),
        //         authType: req.session.authType
        //     });

        // } else {
        //     res.redirect('http://localhost:3000/login');
        // }
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

        req.session.user = data;

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
        res.redirect('http://localhost:3000');
    };

    app.all('*', authenticate);
    app.get('/', getIndex);
    app.get('/index', getIndex);
    app.get('/connect', getConnect);
    app.get('/login', getLogin);
    app.post('/login/dnt', postLogin);
    app.get('/logout', getLogout);

};

