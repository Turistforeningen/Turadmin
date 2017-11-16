/*
 * Copyright (c) $year, Den Norske Turistforening (DNT)
 *
 * https://github.com/Turistforeningen/turadmin
 */

var sentry = require('../lib/sentry');

module.exports = function (app, express, options) {
    "use strict";

    var underscore = require('underscore');
    var api = options.api;
    var restProxy = options.restProxy;

    return function (req, res, next) {

        var userGroups = [];

        if (!req.userGroups && req.session && req.session.user && (!!req.session.user.sherpa_id)) {

            api.getAssociationsFor({bruker_sherpa_id: req.session.user.sherpa_id}, function (err, statusCode, associations) {
                if (err) { throw err; }
                if (statusCode === 200) {

                    for (var i = 0; i < associations.length; i++) {
                        if (associations[i].object_id) {
                            userGroups.push(associations[i]);
                        } else {
                            //sentry.captureMessage('Group "' + associations[i].navn + '" without Turbase ID!', {
                            //    level: 'warning',
                            //    extra: {
                            //        user: req.session.user,
                            //        group: associations[i]
                            //    }
                            //});
                        }
                    }

                    req.userGroups = userGroups;

                    var isAdmin = !!underscore.findWhere(userGroups, {navn: 'Den Norske Turistforening'});
                    req.session.user.er_admin = isAdmin;

                    req.session.isDntGroupMember = !!associations.length;

                    restProxy.makeApiRequest('/grupper', Object.assign({}, req, Object.assign({query: {'privat.brukere.id': 'sherpa3:' + req.session.user.sherpa_id}})), undefined, function (data) {
                        req.userExternalGroups = data.documents;

                        next();
                    });

                } else {
                    sentry.captureMessage('Request to DNT API failed!', {
                        extra: {
                            statusCode: statusCode,
                            errors: associations.errors
                        }
                    });
                    next();
                }
            });

        } else {
            // Request already has userGroups set OR user is authenticated by other method than DNT Connect
            next();
        }

    };

};
