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
        Backbone = require('backbone');

    return Backbone.Collection.extend({

        removedModels: [],

        state: {
            pageSize: 20,
            currentPage: 1,
            paginatorRequired: false
        },

        // Order models by date changed, descending
        comparator: function(model) {
            var date = new Date(model.get('endret'));
            return -date;
        },

        parse: function (resp, options) {
            var records = resp.documents || [];
            this.setState(resp);
            return records;
        },

        constructor: function() {
            // To be able to iterate on auto-added models.
            // See https://github.com/jashkenas/backbone/issues/814#issuecomment-4577128
            Backbone.Collection.prototype.constructor.apply(this, arguments);

            this.each($.proxy(function (element, index, list) {
                this.onAdd(element);
            }, this));
        },

        initialize: function (models) {
            this.on('add', this.onAdd, this);
            this.on('remove', this.onRemove, this);
        },


        // Getters and setters

        setState: function (resp) {
            this.state.totalRecords = resp.total;

            var nextPageSkip = this.state.pageSize * this.state.currentPage;
            this.state.nextPageSkip = (nextPageSkip >= this.state.totalRecords) ? false : nextPageSkip;

            var prevPageSkip = (this.state.pageSize * this.state.currentPage) - (this.state.pageSize * 2);
            this.state.prevPageSkip = (prevPageSkip < 0) ? false : prevPageSkip;

            this.state.totalPages = Math.ceil((this.state.totalRecords / this.state.pageSize));

            this.state.paginatorRequired = (this.state.totalRecords > this.state.pageSize) ? true : false;
        },

        setPublished: function () {
            this.each(function (model, index) {
                model.setPublished();
            });
        },

        setUnpublished: function () {
            this.each(function (model, index) {
                model.setUnpublished();
            });
        },


        // Event triggered methods

        onAdd: function (model) {
            model.on('change:removed', function (model) {
                if (model.get('removed') === true) {
                    this.remove(model);
                }
            }, this);
        },

        onRemove: function (model) {
            // Add to removedModels if saved to server, to send a DELETE request when route is saved
            if (!!model.get('id')) {
                this.removedModels.push(model);
            }
        }

    });

});
