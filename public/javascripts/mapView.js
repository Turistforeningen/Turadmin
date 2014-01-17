/*
 * Copyright (c) $year, Den Norske Turistforening (DNT)
 *
 * https://github.com/Turistforeningen/turadmin
 */

var DNT = window.DNT || {};

(function (ns) {
    "use strict";

    function createMapLayers() {
        var topo, summer, winter, cabin, baseLayerConf, overlayConf, routing;

        topo =  L.tileLayer('http://opencache.statkart.no/gatekeeper/gk/gk.open_gmaps?layers=topo2&zoom={z}&x={x}&y={y}', {
            maxZoom: 16,
            attribution: '<a href="http://www.statkart.no/">Statens kartverk</a>'
        });

        summer = L.tileLayer('http://mt3.turistforeningen.no/prod/trail_summer/{z}/{x}/{y}.png', {
            maxZoom: 16,
            attribution: '<a href="http://www.turistforeningen.no/">DNT</a>'
        });

        winter = L.tileLayer('http://mt3.turistforeningen.no/prod/trail_winter/{z}/{x}/{y}.png', {
            maxZoom: 16,
            attribution: '<a href="http://www.turistforeningen.no/">DNT</a>'
        });

        cabin = L.tileLayer('http://mt3.turistforeningen.no/prod/cabin/{z}/{x}/{y}.png', {
            maxZoom: 16,
            attribution: '<a href="http://www.turistforeningen.no/">DNT</a>'
        });

        baseLayerConf = {'Topo 2': topo};
        overlayConf = {
            'DNTs merkede stier': summer,
            'DNTs merkede vinterruter': winter,
            'DNTs turisthytter': cabin
        };

        return {
            baseLayerConf: baseLayerConf,
            overlayConf: overlayConf
        };
    }

    function addRouting(map, snappingLayer) {
        var routing = new DNT.Routing(map, snappingLayer);
        routing.addRouting();
        routing.enableSnapping(true);
        return routing;
    }

    ns.MapView = Backbone.View.extend({

        el: "#routePage",

        snapping: true,

        events: {
            'click #startDraw': 'startDraw',
            'click #toggleSnap': 'toggleSnap'
        },

        initialize: function () {
            this.mapLayers = createMapLayers();
            this.snapping = new L.geoJson(null, {
                style: {
                    opacity: 0,
                    clickable: false
                }
            });
        },

        startDraw: function (e) {
            this.routing.enable(true);
        },

        toggleSnap: function (e) {
            this.snapping = !this.snapping;
            this.routing.enableSnapping(this.snapping);
        },

        render: function () {
            var map = L.map(this.$("#mapContainer")[0], {layers: [this.mapLayers.baseLayerConf["Topo 2"]]}).setView([61.5, 9], 13);
            L.control.layers(this.mapLayers.baseLayerConf, this.mapLayers.overlayConf, {
                position: 'topleft'
            }).addTo(map);
            this.snapping.addTo(map);
            this.routing = addRouting(map, this.snapping);
            return this;
        }
    });
}(DNT));