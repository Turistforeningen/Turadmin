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

    ns.Route = Backbone.Model.extend({
        idAttribute: "_id",

        defaults : {
            geojson: null,
            retning: "AB",
            lisens: "CC BY-NC 3.0 NO",
            status: "Kladd",
            privat: {
                opprettet_av: {
                    id: "someId"
                }
            }
        },
        initialize: function () {
        },

        urlRoot: function () {
            return apiUri();
        },

        isValid: function () {
            var geojson = this.get("geojson");
            return !_.isNull(geojson) && !_.isUndefined(geojson);
        },

        addPois: function (ids) {
            if (!!ids && ids.length > 0) {
                var poiArray = this.get("steder") || [];
                poiArray = _.union(poiArray, ids);
                this.set("steder", poiArray);
            }
        },

        addPictures: function (ids) {
            if (!!ids && ids.length > 0) {
                var pictureArray = this.get("bilder") || [];
                pictureArray = _.union(pictureArray, ids);
                this.set("bilder", pictureArray);
            }
        }
    });

    ns.RouteCollection = Backbone.Collection.extend({
        url: function () {
            return apiUri();
        },
        model: ns.Route
    });
}(DNT));

