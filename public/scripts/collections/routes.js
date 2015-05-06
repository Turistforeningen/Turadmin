/*
 * Copyright (c) $year, Den Norske Turistforening (DNT)
 *
 * https://github.com/Turistforeningen/turadmin
 */

define(function (require, exports, module) {
    "use strict";

    // Dependencies
    var $ = require('jquery'),
        _ = require('underscore'),
        Backbone = require('backbone'),
        NtbCollection = require('collections/ntb'),
        RouteModel = require('models/route');

    // Module
    return NtbCollection.extend({

        url: function () {
            return '/restProxy/turer';
        },

        removedModels: [],

        model: RouteModel,

        fetchQuery: {},


        // Filters custom to routes

        setFilterType: function (type) {
            this.fetchQuery = this.fetchQuery || {};

            switch (type) {
                case 'Alle':
                    delete this.fetchQuery['fields'];
                    delete this.fetchQuery['rute.type'];
                    break;

                case 'Sommerrute':
                    this.fetchQuery['rute.type'] = 'Sommer';
                    this.fetchQuery['fields'] = 'rute,endret,navn,status';
                    break;

                case 'Vinterløype':
                    this.fetchQuery['rute.type'] = 'Vinter';
                    this.fetchQuery['fields'] = 'rute,endret,navn,status';
                    break;

                default:
                    break;
            }

            this.trigger('change:filter');
        }

    });
});
