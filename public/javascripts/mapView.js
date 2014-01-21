/*
 * Copyright (c) $year, Den Norske Turistforening (DNT)
 *
 * https://github.com/Turistforeningen/turadmin
 */

var DNT = window.DNT || {};

(function (ns) {
    "use strict";

    function createMapLayers() {
        var topo, summer, winter, cabin, baseLayerConf, overlayConf;

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

    function createSnapLayer() {
        return new L.geoJson(null, {
            style: {
                opacity: 0,
                clickable: false
            }
        });
    }

    function createDrawControl() {
        var drawControl = new L.Control.Draw({
            draw: {
                position  : 'topleft',
                polyline  : null,
                circle    : null,
                rectangle : null,
                polygon   : null,
                marker : {
                    icon: L.icon({
                        iconUrl: 'images/poi/21.png',
                        iconRetinaUrl: 'images/poi/21@2x.png',
                        iconSize: [26, 32],
                        iconAnchor: [13, 32],
                        popupAnchor: [-0, -30]
                    })
                }
            },
            edit: null
        });
        return drawControl;
    }


    ns.MapView = Backbone.View.extend({

        el: "#routePage",

        snapping: true,

        draw: false,

        events: {
            'click #startDraw': 'toggleDraw',
            'click #toggleSnap': 'toggleSnap',
            'click #deleteRoute': 'deleteRoute'
        },

        initialize: function () {
            this.mapLayers = createMapLayers();
            this.snapping = createSnapLayer();
            this.drawControl = createDrawControl();
        },

        toggleDraw: function (e) {
            this.draw = !this.draw;
            this.routing.enable(this.draw);
            if (this.draw === true) {
                $(e.currentTarget).addClass("active");
                $(e.currentTarget).find(".buttonText").html("Avslutt inntegning");
            } else {
                $(e.target).removeClass("active");
                $(e.currentTarget).find(".buttonText").html("Start inntegning");
                this.model.set({geojson: this.routing.getGeojson()});
            }
        },

        toggleSnap: function (e) {
            this.snapping = !this.snapping;
            this.routing.enableSnapping(this.snapping);
            if (this.snapping) {
                $(e.currentTarget).addClass("active");
            } else {
                $(e.currentTarget).removeClass("active");
            }
        },

        deleteRoute: function (e) {

        },

        render: function () {
            this.map = L.map(this.$("#mapContainer")[0], {layers: [this.mapLayers.baseLayerConf["Topo 2"]]}).setView([61.5, 9], 13);
            L.control.layers(this.mapLayers.baseLayerConf, this.mapLayers.overlayConf, {
                position: 'topleft'
            }).addTo(this.map);
            this.snapping.addTo(this.map);
            this.routing = addRouting(this.map, this.snapping);
            this.map.addControl(this.drawControl);
            return this;
        }
    });
}(DNT));