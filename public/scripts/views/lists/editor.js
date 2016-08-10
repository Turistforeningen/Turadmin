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
        NtbEditorView = require('views/ntb/editor'),
        PoiCollection = require('collections/pois'),
        ListModel = require('models/list'),
        ListDetailsView = require('views/lists/details'),
        ListPoisView = require('views/lists/pois');

    require('backbone-stickit');
    require('backbone-validation');
    require('bootstrap');
    require('jquery-ssr');

    // Module
    return NtbEditorView.extend({

        el: '[data-view="app"]',

        initialize: function (options) {

            // Set up model
            this.model = new ListModel(options.listData);


            // Set up views

            this.listDetailsView = new ListDetailsView({
                el: '[data-view="list-details"]',
                list: this.model,
                editor: this
            }).render();

            this.listPoisView = new ListPoisView({
                el: '[data-view="list-pois"]',
                // list: this.model,
                pois: this.model.steder,
                editor: this
            }).render();

            // Init super
            NtbEditorView.prototype.initialize.call(this, options);
        }

    });

});
