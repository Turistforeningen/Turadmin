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

            if (!!options.pictures) {
                this.pictures = options.pictures;
                this.pictures.on('add', this.addPictureMarker, this);
                this.pictures.on('remove', this.removePictureMarker, this);
            }

            if (!!options.pois) {
                this.pois = options.pois;
                this.pois.on('add', this.addPoiMarker, this);
                this.pois.on('remove', this.removePoiMarker, this);
            }
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

            // Add GeoJSON layer for pictures to map
            if (!!this.pictures) {
                this.createPicturesGeoJsonLayer().addTo(this.map);
            }

            // Add GeoJSON layer for POIs to map
            if (!!this.pois) {
                this.createPoisGeoJsonLayer().addTo(this.map);
            }

            return this;
        },

        createMarker: function (model) {

            var icon = model.get('markerIcon') || '21';

            var icon = new L.icon({
                iconUrl: '/images/markers/' + icon + '.png',
                iconRetinaUrl: '/images/markers/' + icon + '@2x.png',
                iconSize: [26, 32],
                iconAnchor: [13, 32],
                popupAnchor: [-0, -30]
            });

            var marker = new L.Marker([model.getGeoJson().coordinates[1], model.getGeoJson().coordinates[0]], {draggable: true});
            marker.setIcon(icon);
            model.marker = marker;

            if (!!model.popoverTemplateId) {
                new ns.PopoverView({model: model, marker: marker, templateId: model.popoverTemplateId}).render();
            }

            marker.on('dragend', function () {
                var lat = marker.getLatLng().lat;
                var lng = marker.getLatLng().lng;
                model.updateGeojson(lat, lng);
            }, this);

            return marker;

        },

        addPictureMarker: function (picture) {
            if (picture.get('isPositioned') === true) {
                var marker = picture.marker || this.createMarker(picture);
                if (!!marker) {
                    this.picturesGeoJsonLayer.addLayer(picture.marker);
                }
            }
        },

        removePictureMarker: function (picture) {
            var marker = picture.marker;
            if (!!marker) {
                this.picturesGeoJsonLayer.removeLayer(marker);
            }
        },

        createPicturesGeoJsonLayer: function () {
            this.picturesGeoJsonLayer = new L.GeoJSON(null);

            this.pictures.each($.proxy(function(picture, index, list){
                if (picture.hasPosition()) {
                    var marker = this.createMarker(picture);
                    if (!!marker) {
                        this.picturesGeoJsonLayer.addLayer(marker);
                    }
                }
            }, this));

            return this.picturesGeoJsonLayer;
        },


        /**
         * POI Markers
         */

        addPoiMarker: function (poi) {
            var marker = poi.marker || this.createMarker(poi);
            if (!!marker) {
                this.poisGeoJsonLayer.addLayer(poi.marker);
            }
        },

        removePoiMarker: function (poi) {
            var marker = poi.marker;
            if (!!marker) {
                this.poisGeoJsonLayer.removeLayer(marker);
            }
        },

        createPoisGeoJsonLayer: function () {
            this.poisGeoJsonLayer = new L.GeoJSON(null);

            this.pois.each($.proxy(function(poi, index, list){
                if (poi.hasPosition()) {
                    var marker = this.createMarker(poi);
                    if (!!marker) {
                        this.poisGeoJsonLayer.addLayer(marker);
                    }
                }
            }, this));

            return this.poisGeoJsonLayer;
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
                        console.log(err);
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
