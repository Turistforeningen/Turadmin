/*
 * Copyright (c) $year, Den Norske Turistforening (DNT)
 *
 * https://github.com/Turistforeningen/turadmin
 */

var DNT = window.DNT || {};

(function (ns) {
    "use strict";
    var mapView, MapView;

    //var restUri = "http://localhost:3000/restProxy/route/?coords=";
    var restUri = "http://api.turistforeningen.no/route/?coords=";

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

    function addRouting(map, router, snappingLayer) {

        //var myRouter = function (l1, l2, cb) {
          //  console.log("l1: " + l1 + "\nl2: " + l2);
        //};
        var myRouter = function (l1, l2, cb) {
            var routeUri = restUri + [l1.lng, l1.lat, l2.lng, l2.lat].join(',') + '&callback=?';
            var req = $.getJSON(routeUri);
            req.always(function (data, status) {
                if (status === 'success') {
                    try {
                        L.GeoJSON.geometryToLayer(JSON.parse(data)).eachLayer(function (layer) {
                            // 14026
                            var d1 = l1.distanceTo(layer._latlngs[0]);
                            var d2 = l2.distanceTo(layer._latlngs[layer._latlngs.length - 1]);

                            if (d1 < 10 && d2 < 10) {
                                return cb(null, layer);
                            }
                            return cb(new Error('This has been discarded'));
                        });
                    } catch (e) {
                        return cb(new Error('Invalid JSON'));
                    }
                } else {
                    return cb(new Error('Routing failed'));
                }
            });
        };

        var routing = new L.Routing({
            position: 'topleft',
            routing: {
                router: myRouter
            },
            snapping: {
                layers: [snappingLayer],
                sensitivity: 15,
                vertexonly: false
            }
        });

        map.addControl(routing);
        routing.draw(true);
    }

    ns.MapView = Backbone.View.extend({

        el: "#mapContainer",

        mapLayers: createMapLayers(),

        snapping: new L.geoJson(null, {
            style: {
                opacity: 0,
                clickable: false
            }
        }),

        initialize: function () {
            this.render();
        },

        render: function () {
            var map = L.map(this.el, {layers: [this.mapLayers.baseLayerConf["Topo 2"]]}).setView([61.5, 9], 13);
            L.control.layers(this.mapLayers.baseLayerConf, this.mapLayers.overlayConf, {
                position: 'topleft'
            }).addTo(map);
            this.snapping.addTo(map);
            addRouting(map, undefined, this.snapping);
            return this;
        }
    });
}(DNT));