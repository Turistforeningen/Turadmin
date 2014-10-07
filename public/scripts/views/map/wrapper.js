define(function (require, exports, module) {
    "use strict";

    // Dependencies
    var $ = require('jquery'),
        _ = require('underscore'),
        Backbone = require('backbone'),
        Template = require('text!templates/map/wrapper.html'),
        L = require('leaflet'),
        MapPopoverView = require('views/map/popover');

    require('leaflet-routing');
    require('leaflet-draw');
    require('leaflet-routing');
    require('leaflet-routing-lineutilsnapping');
    require('leaflet-routing-markersnapping');
    require('leaflet-routing-storage');
    require('leaflet-routing-draw');
    require('leaflet-routing-edit');

    var Routing = require('routing');

    // Module
    return Backbone.View.extend({

        el: '[data-view="map"]',
        template: _.template(Template),

        initialize: function (options) {

            this.mapLayers = this.createMapLayers();
            this.snapLayer = this.createSnapLayer();
            this.drawControl = this.createDrawControl();

            // Handle options
            options = options || {};

            if (!!options.pictures) {
                this.pictures = options.pictures;
                this.pictures.on('add', this.addPictureMarker, this);
                this.pictures.on('remove', this.removePictureMarker, this);
                this.pictures.on('change:geojson', this.onPictureGeoJsonChange, this);
            }

            if (!!options.pois) {
                this.pois = options.pois;
                this.pois.on('add', this.addPoiMarker, this);
                this.pois.on('remove', this.removePoiMarker, this);
            }

            if (!!options.poi) {
                this.poi = options.poi;
                this.poi.on('change:geojson', this.onPoiGeoJsonChange, this);
            }

            if (!!options.route) {
                this.route = options.route;
                this.route.on('change:geojson', this.onRouteGeoJsonChange, this);
            }

            this.setMapView({center: options.mapCenter, zoom: options.mapZoom});

            // Focus on new position whenever a marker is moved.
            this.event_aggregator.on('marker:positionChange', this.onMarkerPositionChange, this);
        },

        setMapView: function (options) {

            this.mapZoom = options.zoom || 13;
            this.mapCenter = L.latLng(61.5, 9);

            if (!!options.center) {
                if (options.center instanceof L.LatLng) {
                    this.mapCenter = options.center;
                } else {
                    this.mapCenter = L.latLng(options.center[0], options.center[1]);
                }

            } else if (!!this.route) {
                var routeGeoJson = this.route.get('geojson');

                // TODO: Implement this (getlatlng) in route model
                if (!!routeGeoJson && routeGeoJson.coordinates && routeGeoJson.coordinates[0].length === 2) {
                    var firstLatLng = routeGeoJson.coordinates[0];
                    this.mapCenter = L.latLng(firstLatLng[1], firstLatLng[0]);
                }

            } else if (!!this.poi) {
                var poiLatLng = this.poi.getLatLng();
                if (!!poiLatLng) {
                    this.mapCenter = L.latLng(poiLatLng[0], poiLatLng[1]);
                }
            }

            if (!!this.map && (typeof this.map.setView === 'function')) {
                this.map.setView(this.mapCenter, this.mapZoom);
            }

        },

        onPoiGeoJsonChange: function (poi) {
            if (!this.poi.marker) {
                this.addPoiMarker(this.poi);
            }

            var latLng = L.latLng(poi.getLatLng()),
                zoom = this.map.getZoom();

            this.map.setView(latLng, zoom);
        },

        onMarkerPositionChange: function (marker) {
            var newLatLng = marker.getLatLng(),
                zoom = this.map.getZoom();

            this.map.setView(newLatLng, zoom);
        },

        reset: function (options) {

            // COMPLETELY UNBIND THE VIEW
            this.undelegateEvents();

            this.$el.removeData().unbind();

            this.$el.html('');

            // Backbone.View.prototype.constructor.call(this);
            this.initialize(options);

            this.render();
            // Remove view from DOM
            // this.remove();
            // Backbone.View.prototype.remove.call(this);

        },

        render: function () {

            var html = this.template();
            this.$el.html(html);

            var mapOptions = {
                layers: [this.mapLayers.baseLayerConf['Topo 2']],
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

            // Add GeoJSON to routing
            this.addGeoJsonToRouting();

            // Add GeoJSON layer for pictures to map
            if (!!this.pictures) {
                this.createPicturesGeoJsonLayer().addTo(this.map);
            }

            // Add GeoJSON layer for POIs to map
            if (!!this.pois || !!this.poi) {
                this.createPoisGeoJsonLayer().addTo(this.map);
            }

            return this;
        },

        createMarker: function (model) {

            var iconId = model.get('markerIcon') || '21';

            var icon = new L.icon({
                iconUrl: '/images/markers/' + iconId + '.png',
                iconRetinaUrl: '/images/markers/' + iconId + '@2x.png',
                iconSize: [26, 32],
                iconAnchor: [13, 32],
                popupAnchor: [-0, -30]
            });

            var marker = new L.Marker([model.getGeoJson().coordinates[1], model.getGeoJson().coordinates[0]], {draggable: true});
            marker.setIcon(icon);
            model.marker = marker;

            if (!!model.popoverTemplate) {
                new MapPopoverView({model: model, marker: marker, template: model.popoverTemplate}).render();
            }

            marker.on('dragend', function () {
                var lat = marker.getLatLng().lat;
                var lng = marker.getLatLng().lng;
                model.updateGeojson(lat, lng);
            }, this);

            return marker;

        },

        // Only supports creating marker if picture does not already have marker, will not move existing marker to new position.
        onPictureGeoJsonChange: function (picture, value, options) {
            if (!picture.marker) {
                this.addPictureMarker(picture);
            }
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

            this.pictures.each($.proxy(function (picture, index, list) {
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
                this.poisGeoJsonLayer.addLayer(marker);
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

            if (typeof this.pois === 'object' && this.pois.length) {
                this.pois.each($.proxy(function(poi, index, list){
                    if (poi.hasPosition()) {
                        var marker = this.createMarker(poi);
                        if (!!marker) {
                            this.poisGeoJsonLayer.addLayer(marker);
                        }
                    }
                }, this));
            }

            if (!!this.poi) {
                var geoJson = this.poi.get('geojson');

                if (!!geoJson && (geoJson.type === 'Point') && (!!geoJson.properties || !!geoJson.coordinates)) {
                    this.addPoiMarker(this.poi);
                }
            }

            return this.poisGeoJsonLayer;
        },

        addRouting: function () {
            this.routing = new Routing(this.map, this.snapLayer);
            this.routing.addRouting();
            this.routing.enableSnapping(true);

            // TODO: Improve code, by interacting directly with this routing.
            this.routing.routing.on('routing:routeWaypointEnd', this.setRouteModelGeoJsonFromMap, this);

        },

        setRouteModelGeoJsonFromMap: function () {
            var geoJson = this.routing.getGeoJson();
            this.route.set({geojson: geoJson});
        },

        zoomAndCenter: function (latlng, zoomLevel) {
            if (!!latlng) {
                if (!zoomLevel) {
                    zoomLevel = 13;
                }
                this.map.setView(latlng, zoomLevel);
            }
        },

        addGeoJsonToRouting: function (geoJson) {
            geoJson = geoJson || (this.route && this.route.get('geojson'));

            if (!!geoJson && (geoJson.type === 'LineString') && (!!geoJson.properties || !!geoJson.coordinates)) {
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
        },


        modalizeMap: function (options, callback) {
            // Set the height of [data-container-for="map-and-controls"] to the height it already has,
            // as a style attribute, to avoid collapsing when moving map to modal.
            this.$el.height(this.$el.height());

            var $modalBody = $('#modal-map .modal-body');

            this.$el.appendTo($modalBody);
            $('#modal-map').modal('show');

            $('#modal-map').on('hidden.bs.modal', $.proxy(function (e) {
                this.$el.appendTo($('[data-container-for="map"]'));
                this.disableMarkerTool();
            }, this));

        },

        positionModel: function (model, callback) {
            this.modalizeMap();
            this.createDrawMarkerTool();
            this.enableMarkerTool(model, callback);
        },

        enableMarkerTool: function (model, callback) {
            this.drawMarkerTool.enable();

            this.map.on('draw:created', $.proxy(function (model, callback, e) {
                var marker = e.layer,
                    latLng = marker.getLatLng(),
                    lat = latLng.lat,
                    lng = latLng.lng;

                this.map.off('draw:created');

                callback(model, [lat, lng]);

            }, this, model, callback), this);
        },

        disableMarkerTool: function () {
            this.drawMarkerTool.disable();
        },

        showModelPosition: function (model) {

            // TODO: Add boolean option modalize

            var mapShowCallback = function (model) {
                // this.mapWrapper.map.panTo(picture.marker.getLatLng(), {animate: true}); // Using autoPan
                model.marker.openPopup().update();
                $('#modal-map').off('shown.bs.modal'); // Remove event listener
            };

            var mapHideCallback = function (model) {
                model.marker.closePopup();
                $('#modal-map').off('hidden.bs.modal'); // Remove event listener
            };

            // Need to delay the popup showing until after the modal is shown, to prevent messed up popup layout.
            $('#modal-map').on('shown.bs.modal', $.proxy(mapShowCallback, this, model));

            // Listen to modal hide event, to close popup
            $('#modal-map').on('hidden.bs.modal', $.proxy(mapHideCallback, this, model));

            this.modalizeMap();

        },

        createDrawMarkerTool: function () {
            var icon = new L.icon({
                iconUrl: '/images/markers/21.png',
                iconRetinaUrl: '/images/markers/21@2x.png',
                iconSize: [26, 32],
                iconAnchor: [13, 32],
                popupAnchor: [-0, -30]
            });

            this.drawMarkerTool = new L.Draw.Marker(this.map, {
                icon: icon
            });
        }

    });

});
