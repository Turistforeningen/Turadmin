/*
 * Copyright (c) $year, Den Norske Turistforening (DNT)
 *
 * https://github.com/Turistforeningen/turadmin
 */

var DNT = window.DNT || {};

(function (ns) {
    "use strict";

    ns.MapView = Backbone.View.extend({

        el: '[data-view="map"]',

        initialize: function (options) {
            options = options || {};

            this.mapCenter = options.mapCenter || L.latLng(61.5, 9);
            this.mapZoom = options.mapZoom || 13;

            this.mapLayers = this.createMapLayers();
            this.snapLayer = this.createSnapLayer();
            this.drawControl = this.createDrawControl();
        },

        render: function () {

            this.$el.html('<div data-placeholder-for="map" style="height: 500px; width: 100%; margin-top: 10px; border: 1px solid #ccc;">');

            var mapOptions = {
                layers: [this.mapLayers.baseLayerConf["Topo 2"]],
                scrollWheelZoom: false,
                center: this.mapCenter,
                zoom: this.mapZoom
            };

            this.map = L.map($('[data-placeholder-for="map"]')[0], mapOptions);

            // Add layer controls for selecting layer to map
            L.control.layers(this.mapLayers.baseLayerConf, this.mapLayers.overlayConf, {
                position: 'topleft'
            }).addTo(this.map);

            // Add draw control to map
            this.map.addControl(this.drawControl);

            // Add snap layer to map
            this.snapLayer.addTo(this.map);

            // Add routing to map
            this.addRouting();

            // Add GeoJSON to map
            this.addGeoJsonToLayer();

            return this;
        },

        addRouting: function () {
            this.routing = new ns.Routing(this.map, this.snapLayer);
            this.routing.addRouting();
            this.routing.enableSnapping(true);
        },

        zoomAndCenter: function (latlng, zoomLevel) {
            if (!!latlng) {
                if (!zoomLevel) {
                    zoomLevel = 13;
                }
                this.map.setView(latlng, zoomLevel);
            }
        },

        addGeoJsonToLayer: function (geoJson) {
            geoJson = geoJson || this.model.get('geojson');
            if (!!geoJson && (!!geoJson.properties || !!geoJson.coordinates)) {
                this.routing.loadGeoJson(geoJson, {waypointDistance: 50, fitBounds: true}, function(err) {
                    if (err) {
                        // console.log(err);
                    } else {
                        // console.log('Finished loading GeoJSON');
                    }
                });
            } else {
                // console.warn('GeoJSON is not found, or does not have a properties property.');
            }
        },

        createMapLayers: function () {
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
        },

        createSnapLayer: function () {
            return new L.geoJson(null, {
                style: {
                    opacity: 0,
                    clickable: false
                }
            });
        },

        createDrawControl: function () {
            var drawControl = new L.Control.Draw({
                draw: {
                    polyline: null,
                    circle: null,
                    rectangle: null,
                    polygon: null,
                    marker: null
                }
            });
            return drawControl;
        }

    });

}(DNT));
