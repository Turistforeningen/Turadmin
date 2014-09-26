/*
 * Copyright (c) $year, Den Norske Turistforening (DNT)
 *
 * https://github.com/Turistforeningen/turadmin
 */

define(function (require, exports, module) {
    "use strict";



// requirejs(
//     [
//         'jquery',
//         'underscore',
//         'backbone',
//         'state',
//         'views/poi/editor'
//     ],
//     function ($, _, Backbone, state, EditorView) {


    // Dependencies
    var $ = require('jquery'),
        _ = require('underscore'),
        Backbone = require('backbone'),
        PoiEditorView = require('views/poi/editor'),
        state = require('state');

    require('bootstrap');

    // Module
    var event_aggregator = _.extend({}, Backbone.Events);
    Backbone.View.prototype.event_aggregator = event_aggregator;
    Backbone.Model.prototype.event_aggregator = event_aggregator;
    Backbone.Collection.prototype.event_aggregator = event_aggregator;

    console.log('App POI editor init', state);

    var poiEditorView = new PoiEditorView(state);
    poiEditorView.render();

});
