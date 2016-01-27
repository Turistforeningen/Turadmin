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
                case '':
                    delete this.fetchQuery['fields'];
                    delete this.fetchQuery['rute.type'];
                    delete this.fetchQuery['rute'];

                    break;

                case '!':
                    this.fetchQuery['rute'] = '!';
                    this.fetchQuery['fields'] = 'endret,navn,status';
                    delete this.fetchQuery['rute.type'];

                    break;

                case 'Sommer':
                    this.fetchQuery['rute.type'] = 'Sommer';
                    this.fetchQuery['fields'] = 'rute,endret,navn,status';
                    delete this.fetchQuery['rute'];

                    break;

                case 'Vinter':
                    this.fetchQuery['rute.type'] = 'Vinter';
                    this.fetchQuery['fields'] = 'rute,endret,navn,status';
                    delete this.fetchQuery['rute'];

                    break;

                default:
                    break;
            }

            this.trigger('change:filter');
        }

    });
});
