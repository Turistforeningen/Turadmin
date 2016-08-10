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
        ListModel = require('models/list');

    // Module
    return NtbCollection.extend({

        url: function () {
            return '/restProxy/lister';
        },

        removedModels: [],
        model: ListModel,
        fetchQuery: {}

    });
});
