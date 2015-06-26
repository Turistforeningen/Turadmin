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
        IndexView = require('views/groups/index'),
        state = require('state');

    require('bootstrap');

    // Module
    var event_aggregator = _.extend({}, Backbone.Events);
    Backbone.View.prototype.event_aggregator = event_aggregator;
    Backbone.Model.prototype.event_aggregator = event_aggregator;
    Backbone.Collection.prototype.event_aggregator = event_aggregator;

    var indexView = new IndexView(state);
    indexView.render();

});
