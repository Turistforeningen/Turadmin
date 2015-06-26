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
        NtbIndexView = require('views/ntb/index'),
        GroupCollection = require('collections/groups');

    // Module
    return NtbIndexView.extend({
        collection: new GroupCollection(),
        defaultFetchQuery: {
            tags: '!DNT',
            sort: 'navn'
        }
    });

});
