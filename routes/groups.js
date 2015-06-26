/*
 * Copyright (c) $year, Den Norske Turistforening (DNT)
 *
 * https://github.com/Turistforeningen/turadmin
 */

var sentry = require('../lib/sentry');

module.exports = function (app, options) {
    "use strict";

    var underscore = require('underscore');
    var userGroupsFetcher = options.userGroupsFetcher;
    var restProxy = options.restProxy;
    var NodeCache = require('node-cache');
    var cache = new NodeCache();
    var TurbasenAuth = require('turbasen-auth');

    var turbasenAuthClient = new TurbasenAuth('Turadmin', process.env.NTB_API_KEY, {env: process.env.NTB_ENV || 'dev'});


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
                itemType: 'grupper'
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

            req.renderOptions = req.renderOptions || {};
            req.renderOptions.title = groupData.navn;
            req.renderOptions.groupName = groupData.navn;
            req.renderOptions.groupData = JSON.stringify(groupData);

            res.render('groups/editor', req.renderOptions);

        };

        restProxy.makeApiRequest('/grupper/' + groupId, req, undefined, onCompleteGroupRequest);
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

    app.get('/grupper*', userGroupsFetcher);
    app.get('/grupper*', getGroupsAll);
    app.get('/grupper', getGroupsIndex);
    app.get('/grupper/ny', getGroupsNew);
    app.get('/grupper/:id', getGroupsEdit);

    app.post('/ntb-api/grupper', postPutGroups);
    app.put('/ntb-api/grupper/:id', postPutGroups);

};
