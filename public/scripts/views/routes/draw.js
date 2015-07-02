/*
 * Copyright (c) $year, Den Norske Turistforening (DNT)
 *
 * https://github.com/Turistforeningen/turadmin
 */

define(function (require, exports, module) {
    "use strict";

    // Dependencies
    var $ = require('jquery'),
        Backbone = require('backbone'),
        Template = require('text!templates/routes/draw.html'),
        BoundaryIntersectTemplate = require('text!templates/routes/boundary.html'),
        MapWrapper = require('views/map/wrapper'),
        SsrSimpleView = require('views/ssr/simple'),
        GpxUploadView = require('views/routes/gpxupload');

    require('bootstrap');

    // Module
    return Backbone.View.extend({

        el: '[data-view="route-draw"]',
        template: _.template(Template),
        boundaryIntersectTemplate: _.template(BoundaryIntersectTemplate),

        drawMarkerTool: undefined,
        draw: false,
        routeModel: undefined,
        modelToPosition: undefined,
        routingEnabled: true,
        snappingEnabled: true,

        events: {
            'click [data-toggle="route-draw-tool"]': 'toggleDraw',
            'click [data-route-draw-toggle-routing]': 'toggleRouting',
            'click [data-route-direction-option]': 'setRouteDirection',
            'click [data-action="route-draw-reset"]': 'routeDrawReset'
        },

        initialize: function (options) {

            _.bindAll(this, 'zoomAndCenter', 'loadGpxGeometry', 'renderDrawButton', 'toggleRouting');

            // this.poiCollection = this.model.get('poiCollection');
            this.pictures = options.pictures;
            this.routeModel = options.model;
            this.event_aggregator.on("map:loadGpxGeometry", this.loadGpxGeometry);
            this.event_aggregator.on("map:showPopup", this.registerPopover);
            this.event_aggregator.on("map:zoomAndCenter", this.zoomAndCenter);

            this.routeModel.on('change:fylker', this.renderBoundaryIntersect, this);
            this.routeModel.on('change:kommuner', this.renderBoundaryIntersect, this);
            this.routeModel.on('change:områder_navn', this.renderBoundaryIntersect, this);
            this.routeModel.on('geoserver:error', this.onGeoServerError, this);

            if (!!options.map) {
                this.mapWrapper = options.map;
            }
        },

        render: function () {

            // var data = this.model.toJSON();
            var html = this.template();
            this.$el.html(html);

            if (!this.mapWrapper) {
                this.initMap({route: this.model, pictures: this.pictures, pois: this.pois});
            }

            this.routeModel.on("geojson:add", this.mapWrapper.addGeoJsonToRouting);

            // this.mapWrapper = new MapWrapper({route: this.model, pictures: this.pictures});
            // this.mapWrapper.render();

            this.ssr = new SsrSimpleView({
                callback: $.proxy(this.onPositionBySsr, this)
            });
            this.ssr.render();

            var gpxUploadView = new GpxUploadView({callback: $.proxy(this.onGpxUpload, this)}).render();

            this.updateRoutingToggle();
            this.updateRouteDirectionSelect();
            this.renderDrawButton();
            this.renderBoundaryIntersect();

            return this;
        },

        onGpxUpload: function (geometry) {

            var routeGeoJsonExists = this.model.hasRoute();

            this.geometry = geometry;

            if (routeGeoJsonExists === true) {
                $('#modal-confirm-route-replace').modal('show');
            } else {
                this.loadUploadedGpxInMap();
            }

        },

        loadUploadedGpxInMap: function () {
            this.event_aggregator.trigger('map:loadGpxGeometry', this.geometry);
        },

        onPositionBySsr: function (e) {
            var sted = e.added,
                ssrId = sted.ssrId,
                lat = sted.nord,
                lng = sted.aust;

            this.mapWrapper.setMapView({center: [lat, lng]});
        },

        toggleDraw: function (e) {
            e.preventDefault();
            this.draw = !this.draw;
            this.mapWrapper.routing.enable(this.draw);

            this.renderDrawButton();

            if (this.draw) {
                this.mapWrapper.$map.addClass('drawing');

            } else {
                this.mapWrapper.$map.removeClass('drawing');
            }

            // if (!this.draw) {
            //     this.setRouteModelGeoJsonFromMap();
            // }

            // Route model is now automatically updated on draw end.
        },

        onGeoServerError: function () {
            this.geoServerError = true;
            this.renderBoundaryIntersect();
        },

        renderBoundaryIntersect: function () {
            this.$boundaryIntersect = $('[data-container-for="boundary-intersect"]');
            var html = this.boundaryIntersectTemplate({model: this.model.toJSON(), err: this.geoServerError});
            this.$boundaryIntersect.html(html);
        },

        renderDrawButton: function () {
            var $drawButton = $('button[data-toggle="route-draw-tool"]');

            if (this.draw === true) {
                $drawButton.addClass('active');
                $drawButton.find('.buttonText').html('&nbsp;Avslutt inntegning');
            } else {
                var geojson = this.mapWrapper.routing.getGeoJson();
                $drawButton.removeClass("active");
                var label = "&nbsp;Start inntegning";
                if (geojson.coordinates.length > 0) {
                    label = "&nbsp;Fortsett inntegning";
                }
                $drawButton.find(".buttonText").html(label);
                this.routeModel.set({geojson: geojson});
            }
        },

//         setRouteModelGeoJsonFromMap: function () {
//             var geojson = this.mapWrapper.routing.getGeoJson();
//             this.routeModel.set({geojson: geojson});
//         },

        setRouteDirection: function (e) {
            e.preventDefault();
            var selectedDirection = $(e.currentTarget).attr('data-route-direction-option');
            this.routeModel.set('retning', selectedDirection);
            this.updateRouteDirectionSelect();
        },

        toggleRouting: function (e) {
            e.preventDefault();
            this.routingEnabled = !this.routingEnabled;
            this.mapWrapper.routing.enableSnapping(this.routingEnabled);
            this.updateRoutingToggle();
        },

        updateRoutingToggle: function () {
            var routingEnabled = (this.routingEnabled) ? true : false;
            $('[data-route-draw-toggle-routing] input[type="checkbox"]').prop('checked', routingEnabled);
        },

        toggleSnapping: function (e) {
            e.preventDefault();
            this.snappingEnabled = !this.snappingEnabled;
            this.mapWrapper.routing.enableSnapping(this.snappingEnabled);
        },

        updateRouteDirectionSelect: function () {
            var routeDirection = this.routeModel.get('retning') || '';
            $('[data-route-direction-option]').removeClass('active');
            $('[data-route-direction-option="' + routeDirection + '"]').addClass('active');

            var labelValue = (function (routeDirection) {
                var str = '';
                for ( var i = 0; i < (routeDirection.length); i++) {
                    str += routeDirection.charAt(i).toUpperCase() + '-';
                }
                str = str.substring(0, str.length - 1);
                return str;
            })(routeDirection);

            $('[data-route-direction-value-placeholder]').text(labelValue);
        },

        loadGpxGeometry: function (gpxGeometry) {
            var routeGeoJson = this.routeModel.get('geojson'),
                routeGeoJsonExists = !!routeGeoJson && !!routeGeoJson.coordinates && (routeGeoJson.coordinates.length > 0);

            if (routeGeoJsonExists === true) {
                this.routeDrawReset();
            }

            this.mapWrapper.addGeoJsonToRouting(gpxGeometry);
            var geoJson = this.mapWrapper.routing.getGeoJson();
            this.routeModel.set('geojson', geoJson, {silent: true});
        },

        zoomAndCenter: function (latlng, zoomLevel) {
            if (!!latlng) {
                if (!zoomLevel) {
                    zoomLevel = 13;
                }
                this.mapWrapper.map.setView(latlng, zoomLevel);
            }
        },

        routeDrawReset: function (e) {
            // Change draw state to false
            this.draw = false;

            // Enable routing by default when resetting route
            this.routingEnabled = true;

            var route = this.model;
            route.unset('geojson');

            var mapCenter = this.mapWrapper.map.getCenter();
            var mapZoom = this.mapWrapper.map.getZoom();

            // debugger;
            // this.mapWrapper.remove();
            this.mapWrapper.reset({
                route: route,
                mapCenter: mapCenter,
                mapZoom: mapZoom,
                pictures: this.pictureCollection,
                pois: this.poiCollection
            });

            // $('[data-container-for="map"]').html('<div data-view="map"></div>');

            // this.initMap({
            //     route: route,
            //     mapCenter: mapCenter,
            //     mapZoom: mapZoom,
            //     pictures: this.pictureCollection,
            //     pois: this.poiCollection
            // });

            this.showFindPlaceAndGpxUpload();
            this.renderDrawButton();
            this.updateRoutingToggle();
        },

        initMap: function (options) {

            this.mapWrapper = new MapWrapper(options);
            this.mapWrapper.render();

            // this.addOnDrawCreatedEventHandler();

            // this.createDrawMarkerTool();

            // TODO: Handle routing event in DNT.Routing?
            // this.mapWrapper.routing.routing.on('routing:routeWaypointEnd', this.setRouteModelGeoJsonFromMap, this);

        },

        // render: function () {
        //     this.initMap({model: this.model.get('route'), pictures: this.pictureCollection, pois: this.poiCollection});

        //     this.updateRoutingToggle();
        //     this.updateRouteDirectionSelect();
        //     this.renderDrawButton();

        //     return this;
        // },

        showFindPlaceAndGpxUpload: function () {
            this.$('.findplace-gpxupload-container').removeClass('hidden');
        },

        hideFindPlaceAndGpxUpload: function () {
            this.$('.findplace-gpxupload-container').addClass('hidden');
        }

    });

});

//     function createGeojson(coordinates) {
//         var geojson = {
//             type: "Point",
//             coordinates: [coordinates.layer._latlng.lng, coordinates.layer._latlng.lat],
//             properties: {}
//         };
//         return geojson;
//     }




//     });

// }(DNT));
