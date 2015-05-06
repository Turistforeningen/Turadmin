/*
 * Copyright (c) $year, Den Norske Turistforening (DNT)
 *
 * https://github.com/Turistforeningen/turadmin
 */

var sentry = require('../lib/sentry');

module.exports = function (app, express, options) {
    "use strict";

    var api = options.api;

    return function (req, res, next) {

        var userGroups = [];

        if (req.session && req.session.user && (!!req.session.user.sherpa_id)) {

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
                    next();

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
            // User is authenticated by other method than DNT Connect
            next();
        }

    };

};
