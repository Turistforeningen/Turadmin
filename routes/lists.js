/*
 * Copyright (c) $year, Den Norske Turistforening (DNT)
 *
 * https://github.com/Turistforeningen/turadmin
 */

var sentry = require('../lib/sentry');
var fetch = require('node-fetch');

module.exports = function (app, options) {
    "use strict";

    var underscore = require('underscore');
    var userGroupsFetcher = options.userGroupsFetcher;
    var restProxy = options.restProxy;
    var NodeCache = require('node-cache');
    var cache = new NodeCache();
    var TurbasenAuth = require('turbasen-auth');

    var turbasenAuthClient = new TurbasenAuth('Turadmin', process.env.NTB_API_KEY, {
        env: process.env.NTB_API_ENV || 'dev'
    });


    /*
     * All GET requests to /grupper
     */
    var getListsAll = function (req, res, next) {

        if (req.session.isDntGroupMember) {
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
    var getListsIndex = function (req, res, next) {

        var userGroups = req.userGroups || [];
        var userDefaultGroupFetchQuery = (!!req.signedCookies && req.signedCookies['userDefaultGroupFetchQuery_' + req.session.userId]) ? req.signedCookies['userDefaultGroupFetchQuery_' + req.session.userId] : {};

        var lists;
        var onCompleteListerRequest = function (data) {
            // cache.set('/grupper/?tags=!&limit=200&fields=navn&sort=navn', data, 86400);
            lists = data.documents;
            onCompleteNtbRequest();
        };

        var onCompleteNtbRequest = underscore.after(1, function () {
            var renderOptions = {
                title: 'Mine grupper',
                userData: JSON.stringify(req.session.user),
                userGroups: JSON.stringify(userGroups),
                lists: JSON.stringify(lists),
                authType: req.session.authType,
                itemType: 'lister',
                isAdmin: req.session.user.er_admin
            };

            res.render('lists/index', renderOptions);
        });

        restProxy.makeApiRequest('/lister/?limit=50', req, undefined, onCompleteListerRequest);

    };

    var getListsNew = function (req, res, next) {
        req.renderOptions = req.renderOptions || {};
        req.renderOptions.title = 'Ny liste';
        res.render('lists/editor', req.renderOptions);
    };

    var getListsEdit = function (req, res, next) {
        // Id of list being edited
        var listId = req.params.id;

        // Callback for when list data is fetched from NTB
        var onCompleteListRequest = function (data) {

            var listData = data;

            req.renderOptions = req.renderOptions || {};
            req.renderOptions.title = listData.navn;
            req.renderOptions.groupName = listData.navn;

            Promise.all(data.steder.map(id => (
                fetch(`${process.env.NTB_API_URL}/steder/${id}`, {
                    headers: {
                        Authorization: `token ${process.env.NTB_API_KEY}`
                    }
                }).then(sted => sted.json())
            ))).catch(err => {
                sentry.captureError(err);
            }).then(stederData => {
                listData.steder = stederData;
                req.renderOptions.listData = JSON.stringify(listData);
                res.render('lists/editor', req.renderOptions);
            });
        };

        restProxy.makeApiRequest('/lister/' + listId + '?expand=bilder', req, undefined, onCompleteListRequest);
    };

    var deleteLists = function (req, res, next) {
        restProxy.makeApiRequest('/lister/' + req.params.id, req, res, undefined);
    };

    var postPutLists = function (req, res, next) {
        var uri = '/lister';
        uri += (!!req.params.id) ? '/' + req.params.id : '';
        restProxy.makeApiRequest(uri, req, res, undefined);
    };

    app.get('/lister*', userGroupsFetcher);
    app.get('/lister*', getListsAll);
    app.get('/lister', getListsIndex);
    app.get('/lister/ny', getListsNew);
    app.get('/lister/:id', getListsEdit);

    app.post('/ntb-api/lister', postPutLists);
    app.put('/ntb-api/lister/:id', postPutLists);
    app.delete('/ntb-api/lister/:id', deleteLists);
};
