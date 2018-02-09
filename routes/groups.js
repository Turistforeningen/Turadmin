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

        req.renderOptions = req.renderOptions || {};
        req.renderOptions.userData = JSON.stringify(req.session.user);
        req.renderOptions.userGroups = JSON.stringify(req.userGroups || []);
        req.renderOptions.userExternalGroups = JSON.stringify(req.userExternalGroups || []);
        req.renderOptions.routeApiUri = options.routeApiUri;
        req.renderOptions.authType = req.session.authType;
        req.renderOptions.isAdmin = req.session.user.er_admin;
        next();

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
                userExternalGroups: req.renderOptions.userExternalGroups,
                authType: req.session.authType,
                itemType: 'grupper',
                isAdmin: req.session.user.er_admin
            };

            res.render('groups/index', renderOptions);
        });

        restProxy.makeApiRequest('/grupper/?tags=!DNT&limit=200&fields=navn,privat&sort=navn', req, undefined, onCompleteGrupperRequest);

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

            var groupUserIds = groupData.privat && groupData.privat.brukere
                ? groupData.privat.brukere.map(function (bruker) {
                    return bruker.id;
                })
                : [];


            var userHasAccess = req.session.user.er_admin || groupUserIds.indexOf('sherpa3:' + req.session.user.sherpa_id) !== -1;

            if (!userHasAccess) {
                res.redirect(403, '/grupper');
            } else if ((typeof groupData.tags === 'undefined') || (groupData.tags.indexOf('Hytte') > -1) || (groupData.tags.indexOf('DNT') === -1)) {

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

        var saveGroup = function (data) {
            if (data) {
                req.body.privat = Object.assign(
                    req.body.privat,
                    {
                        brukere: data.privat.brukere || [],
                        invitasjoner: data.privat.invitasjoner || [],
                    }
                );
            }

            restProxy.makeApiRequest(uri, req, res, undefined);
        };

        // If the group has any invites, fetch the latest version of the
        // group first, to make sure no changes is overwritten
        if (req.params.id && req.body.privat && req.body.privat.invitasjoner && req.body.privat.invitasjoner.length) {
            restProxy.makeApiRequest(
                uri,
                Object.assign({}, req, {method: 'GET'}),
                undefined,
                saveGroup
            );
        } else {
            saveGroup();
        }

    };

    var inviteUser = function (req, res, next) {
        var invite = req.body.invitasjon;
        var groupId = req.params.id;
        var groupUri = '/grupper/' + groupId;

        var status = {
            processed: false,
            sent: false,
            saved: false,
        };

        var afterSave = function (data) {
            status.saved = true;

            var email = {
                to: req.body.epost,
                from: 'UT.no / Den Norske Turistforening <ut@dnt.no>',
                subject: 'Bli medlem av gruppa ' + req.body.gruppe + ' på UT.no',
                html: [
                    '<h2>Hei ' + req.body.navn + ',</h2>',
                    '<p>' + req.body.gruppe + ' er registrert som innholdspartner på',
                    'UT.no, og du er invitert til å bidra med innhold.</p>',
                    '<p><a href="' + req.body.url + '">Klikk her for å bli medlem',
                    'av gruppa</a>.</p>',
                    '<p>Vennlig hilsen<br>',
                    '<a href="https://www.ut.no">UT.no</a> /',
                    '<a href="https://www.dnt.no">Den Norske Turistforening</a></p>'
                ].join(' ')
            };

            sendgrid.send(email)
                .then(function (response) {
                    var result = response[0];
                    var body = response[1];
                    status.sent = true;
                    status.processed = true;

                    res.json(status);
                })
                .catch(function (err) {
                    sentry.captureMessage('Sending invite using Sendgrid failed', { extra: { err: err }});

                    status.processed = true;

                    res.json(status);
                });
        };

        var saveGroup = function (data) {
            data.privat = data.privat || {};
            data.privat.invitasjoner = data.privat.invitasjoner || [];
            data.privat.invitasjoner.push(invite);

            restProxy.makeApiRequest(
                groupUri,
                Object.assign(
                    {},
                    Object.assign({}, req, {
                        body: data
                    }),
                    {method: 'PUT'}
                ),
                undefined,
                afterSave
            );
        };

        restProxy.makeApiRequest(
            groupUri,
            Object.assign({}, req, {method: 'GET'}),
            undefined,
            saveGroup
        );
    };

    var deleteInvite = function (req, res, next) {
        var groupId = req.params.id;
        var groupUri = '/grupper/' + groupId;
        var inviteCode = req.params.code;

        var afterSave = function (data) {
            res.json(data);
        };

        var saveGroup = function (data) {
            data.privat = data.privat || {};
            data.privat.invitasjoner = data.privat.invitasjoner || [];

            var inviteIndex = data.privat.invitasjoner.findIndex(function (i) {
                return i.kode === inviteCode;
            });

            var removedInvite = data.privat.invitasjoner.splice(inviteIndex, 1);

            restProxy.makeApiRequest(
                groupUri,
                Object.assign(
                    {},
                    Object.assign({}, req, {
                        body: data
                    }),
                    {method: 'PUT'}
                ),
                undefined,
                afterSave
            );
        };

        restProxy.makeApiRequest(
            groupUri,
            Object.assign({}, req, {method: 'GET'}),
            undefined,
            saveGroup
        );
    };

    var deleteUser = function (req, res, next) {
        var groupId = req.params.id;
        var groupUri = '/grupper/' + groupId;
        var userId = Number(req.params.user);

        var afterSave = function (data) {
            res.json(data);
        };

        var saveGroup = function (data) {
            data.privat = data.privat || {};
            data.privat.brukere = data.privat.brukere || [];

            var userIndex = data.privat.brukere.findIndex(function (u) {
                return u.id === userId;
            });

            if (userIndex < 0) {
                res.status(404);
            }

            var removedUser = data.privat.brukere.splice(userIndex, 1);

            restProxy.makeApiRequest(
                groupUri,
                Object.assign(
                    {},
                    Object.assign({}, req, {
                        body: data
                    }),
                    {method: 'PUT'}
                ),
                undefined,
                afterSave
            );
        };

        restProxy.makeApiRequest(
            groupUri,
            Object.assign({}, req, {method: 'GET'}),
            undefined,
            saveGroup
        );
    };

    app.get('/grupper*', userGroupsFetcher);
    app.get('/grupper*', getGroupsAll);
    app.get('/grupper', getGroupsIndex);
    app.get('/grupper/ny', getGroupsNew);
    app.get('/grupper/:id', getGroupsEdit);

    app.post('/grupper/:id/invitasjoner', inviteUser);
    app.delete('/grupper/:id/invitasjoner/:code', deleteInvite);
    app.delete('/grupper/:id/brukere/:user', deleteUser);

    app.post('/ntb-api/grupper', postPutGroups);
    app.put('/ntb-api/grupper/:id', postPutGroups);
    app.delete('/ntb-api/grupper/:id', deleteGroups);
};
