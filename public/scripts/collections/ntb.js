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

        setState: function (resp) {
            this.state.totalRecords = resp.total;

            var nextPageSkip = this.state.pageSize * this.state.currentPage;
            this.state.nextPageSkip = (nextPageSkip >= this.state.totalRecords) ? false : nextPageSkip;

            var prevPageSkip = (this.state.pageSize * this.state.currentPage) - (this.state.pageSize * 2);
            this.state.prevPageSkip = (prevPageSkip < 0) ? false : prevPageSkip;

            this.state.totalPages = Math.ceil((this.state.totalRecords / this.state.pageSize));

            this.state.paginatorRequired = (this.state.totalRecords > this.state.pageSize) ? true : false;
        },

        parse: function (resp, options) {
            var records = resp.documents || [];
            this.setState(resp);
            return records;
        }

    });

});
