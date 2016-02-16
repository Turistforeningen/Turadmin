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
        Poi = require('models/poi'),
        NtbCollection = require('collections/ntb');

    // Module
    return NtbCollection.extend({

        url: function () {
            return '/restProxy/steder';
        },

        removedModels: [],

        model: Poi,

        fetchQuery: {},

        // initialize: function (pois) {
        //     NtbCollection.prototype.initialize.call(this, pois);
        // },

        deletePoi: function (model) {
            this.remove(model);
        },

        countPois: function () {
            var count  = this.filter(function (poi) {
                return !poi.isDeleted();
            });
            return count.length;
        },

        getPoiIds: function () {
            return this.pluck('_id');
        },

        setFilterType: function (type) {
            this.fetchQuery = this.fetchQuery || {};

            switch (type) {
                case '':
                    delete this.fetchQuery['fields'];
                    delete this.fetchQuery['tags'];
                    break;

                default:
                    this.fetchQuery['tags.0'] = type;
                    break;
            }

            this.trigger('change:filter');
        }

    });
});
