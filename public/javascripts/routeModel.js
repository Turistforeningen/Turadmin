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

        defaults: {
            navn: '',
            geojson: null,
            lenker: [],
            tidsbrukDager: "1",
            tidsbrukTimer: "0",
            tidsbrukMinutter: "0",
            tidsbruk: {normal: {}},
            retning: "ABA",
            lisens: "CC BY-NC 3.0 NO",
            status: "Kladd",
            privat: {
                opprettet_av: {
                    id: "someId"
                }
            }
        },

        initialize: function () {
            this.on("change:linkText", this.updateLinks);
        },

        urlRoot: function () {
            return apiUri();
        },

        isValid: function () {
            var geojson = this.get("geojson");
            return !_.isNull(geojson) && !_.isUndefined(geojson);
        },

        setPoiIds: function (ids) {
            this.set("steder", ids);
        },

        setPictureIds: function (ids) {
            this.set("bilder", ids);
        },

        //Override save to do some work on the model before model is ready to be saved
        save: function (attributes, options) {
            this.updateLenker();
            this.updateTidsbruk();
            return Backbone.Model.prototype.save.call(this, attributes, options);
        },

        updateLenker: function () {
            var linkText = this.get("linkText");
            var lenker = [];
            if (!!linkText) {
                var links = this.get("linkText").split("\n");
                if (_.isArray(links) && links.length > 0) {
                    var i;
                    for (i = 0; i < links.length; i = i + 1) {
                        var lenke = links[i];
                        if (lenke.length > 0) {
                            lenker.push({url: lenke});
                        }
                    }
                }
            }
            this.set("lenker", lenker);
        },

        updateTidsbruk: function () {
            var days = this.get("tidsbrukDager");
            var hours = this.get("tidsbrukTimer");
            var minutes = this.get("tidsbrukMinutter");
            var tidsbruk = {
                normal: {
                    timer: "0",
                    minutter: "0"
                }
            };
            tidsbruk.normal.dager = days;
            if (days && days === "1") {
                tidsbruk.normal.timer = hours;
                tidsbruk.normal.minutter = minutes;
            }
            this.set("tidsbruk", tidsbruk);
        }

    });

    ns.RouteCollection = Backbone.Collection.extend({
        url: function () {
            return apiUri();
        },

        model: ns.Route,

        parse: function (response) {
            return response.documents || [];
        }
    });

}(DNT));
