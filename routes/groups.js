/*
 * Copyright (c) $year, Den Norske Turistforening (DNT)
 *
 * https://github.com/Turistforeningen/turadmin
 */

var sentry = require('../lib/sentry');
var sendgrid = require('../lib/sendgrid');

module.exports = function (app, options) {
    "use strict";

    var underscore = require('underscore');
    var userGroupsFetcher = options.userGroupsFetcher;
    var restProxy = options.restProxy;
    var NodeCache = require('node-cache');
    var cache = new NodeCache();
    var TurbasenAuth = require('turbasen-auth');

    var turbasenAuthClient = new TurbasenAuth('Turadmin', process.env.NTB_API_KEY, {env: process.env.NTB_API_ENV || 'dev'});


    /*
     * All GET requests to /grupper
     */
    var getGroupsAll = function (req, res, next) {

        if (req.session.user.er_admin) {
            req.renderOptions = req.renderOptions || {};
            req.renderOptions.userData = JSON.stringify(req.session.user);
            req.renderOptions.userGroups = JSON.stringify(req.userGroups || []);
            req.renderOptions.routeApiUri = options.routeApiUri;
            req.renderOptions.authType = req.session.authType;
            req.renderOptions.isAdmin = req.session.user.er_admin;
            next();

        } else {
            res.redirect(401, '/turer');
        }

    };

    /**
     * GET list of groups (index page)
     */
    var getGroupsIndex = function (req, res, next) {

        var userGroups = req.userGroups || [];
        var userDefaultGroupFetchQuery = (!!req.signedCookies && req.signedCookies['userDefaultGroupFetchQuery_' + req.session.userId]) ? req.signedCookies['userDefaultGroupFetchQuery_' + req.session.userId] : {};

        var groups;
        var onCompleteGrupperRequest = function (data) {
            // cache.set('/grupper/?tags=!&limit=200&fields=navn&sort=navn', data, 86400);
            groups = data.documents;
            onCompleteNtbRequest();
        };

        var onCompleteNtbRequest = underscore.after(1, function () {
            var renderOptions = {
                title: 'Mine grupper',
                userData: JSON.stringify(req.session.user),
                userGroups: JSON.stringify(userGroups),
                externalGroups: JSON.stringify(groups),
                authType: req.session.authType,
                itemType: 'grupper',
                isAdmin: req.session.user.er_admin
            };

            res.render('groups/index', renderOptions);
        });

        restProxy.makeApiRequest('/grupper/?tags=!DNT&limit=200&fields=navn&sort=navn', req, undefined, onCompleteGrupperRequest);

    };

    var getGroupsNew = function (req, res, next) {
        req.renderOptions = req.renderOptions || {};
        req.renderOptions.title = 'Ny gruppe';
        res.render('groups/editor', req.renderOptions);
    };

    var getGroupsEdit = function (req, res, next) {
        // Id of group being edited
        var groupId = req.params.id;

        // Callback for when group data is fetched from NTB
        var onCompleteGroupRequest = function (data) {

            var groupData = data;

            if ((typeof groupData.tags === 'undefined') || (groupData.tags.indexOf('Hytte') > -1) || (groupData.tags.indexOf('DNT') === -1)) {

                req.renderOptions = req.renderOptions || {};
                req.renderOptions.title = groupData.navn;
                req.renderOptions.groupName = groupData.navn;
                req.renderOptions.groupData = JSON.stringify(groupData);

                res.render('groups/editor', req.renderOptions);

            } else {
                res.redirect(403, '/grupper');
            }

        };

        restProxy.makeApiRequest('/grupper/' + groupId, req, undefined, onCompleteGroupRequest);
    };

    var deleteGroups = function (req, res, next) {
        restProxy.makeApiRequest('/grupper/' + req.params.id, req, res, undefined);
    };

    var postPutGroups = function (req, res, next) {
        var group = req.body;
        var users = group && group.privat && group.privat.brukere || [];
        var uri = '/grupper';
        uri += (!!req.params.id) ? '/' + req.params.id : '';

        var saveGroup = function () {
            restProxy.makeApiRequest(uri, req, res, undefined);
        };

        var passwordIsPbkdf2 = underscore.after(users.length, function () {
            saveGroup();
        });

        var userAuthCreated = function (err, user) {
            if (err) {
                sentry.captureError(err, {extra: {query: req.query}});

            } else {
                var userIndex = users.indexOf(underscore.findWhere(users, {epost: user.epost}));
                users[userIndex] = user;
                passwordIsPbkdf2();
            }
        };

        if (users && users.length > 0) {

            for (var i = 0, user; i < users.length; i++) {
                user = users[i];

                // If new password is set for any of the users, generate pbkdf2
                if (user.passord) {
                    turbasenAuthClient.createUserAuth(user.navn, user.epost, user.passord, userAuthCreated);

                } else {
                    passwordIsPbkdf2();
                }
            }

        } else {
            saveGroup();
        }

    };

    var inviteUser = function (req, res, next) {
        var email = {
            to: req.body.epost,
            from: 'hjelp@dnt.no',
            subject: 'Invitasjon til ' + req.body.gruppe,
            html: [
                '<h2>Hei ' + req.body.navn + ',</h2>',
                '<p>Du er invitert til gruppen ' + req.body.gruppe + '. <a href="' + req.body.url + '">Klikk her for å bli med</a>.</p><p>Hilsen Den Norske Turistforeningen</p>'
            ].join('')
        };

        sendgrid.send(email)
            .then(([result, body]) => {
                var json = result.toJSON();
                res.status(json.statusCode).send();
            })
            .catch(err => {
                res.status(500).json(err.response.body);
            });
    };

    app.get('/grupper*', userGroupsFetcher);
    app.get('/grupper*', getGroupsAll);
    app.get('/grupper', getGroupsIndex);
    app.get('/grupper/ny', getGroupsNew);
    app.get('/grupper/:id', getGroupsEdit);

    app.post('/grupper/inviter', inviteUser);

    app.post('/ntb-api/grupper', postPutGroups);
    app.put('/ntb-api/grupper/:id', postPutGroups);
    app.delete('/ntb-api/grupper/:id', deleteGroups);
};
