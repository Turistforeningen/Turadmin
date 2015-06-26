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
        GroupModel = require('models/group');

    // Module
    return NtbCollection.extend({

        url: function () {
            return '/restProxy/grupper';
        },

        removedModels: [],
        model: GroupModel,
        fetchQuery: {},
        comparator: undefined, // To override default NTB collection comparator which is sorting by date changed

    });
});
