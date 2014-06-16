/*
 * Copyright (c) $year, Den Norske Turistforening (DNT)
 *
 * https://github.com/Turistforeningen/turadmin
 */

var DNT = window.DNT || {};

(function (ns) {
    "use strict";

    var apiUri = function () {
        return "/restProxy/turer";
    };

    ns.RouteCollection = Backbone.Collection.extend({

        model: ns.Route,
        mode: 'server',
        state: {
            pageSize: 20,
            currentPage: 1
        },

        // Order routes by date changed, descending
        comparator: function(model) {
            var date = new Date(model.get('endret'));
            return -date;
        },

        url: function () {
            return apiUri();
        },

        setState: function (resp) {
            this.state.totalRecords = resp.total;

            var nextPageSkip = this.state.pageSize * this.state.currentPage;
            this.state.nextPageSkip = (nextPageSkip >= this.state.totalRecords) ? false : nextPageSkip;

            var prevPageSkip = (this.state.pageSize * this.state.currentPage) - (this.state.pageSize * 2);
            this.state.prevPageSkip = (prevPageSkip < 0) ? false : prevPageSkip;

            this.state.totalPages = Math.ceil((this.state.totalRecords / this.state.pageSize));
        },

        parse: function (resp, options) {
            var records = resp.documents || [];
            this.setState(resp);
            return records;
        }

    });

}(DNT));
