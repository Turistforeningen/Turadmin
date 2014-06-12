/*
 * Copyright (c) $year, Den Norske Turistforening (DNT)
 *
 * https://github.com/Turistforeningen/turadmin
 */

var DNT = window.DNT || {};

(function (ns) {
    "use strict";

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
                polyline  : null,
                circle    : null,
                rectangle : null,
                polygon   : null,
                marker : null
            }
        });
        return drawControl;
    }

    function createIconConfig() {
        return new L.icon({
            iconUrl: '/images/markers/21.png',
            iconRetinaUrl: '/images/markers/21@2x.png',
            iconSize: [26, 32],
            iconAnchor: [13, 32],
            popupAnchor: [-0, -30]
        });
    }

    function createGeojson(coordinates) {
        var geojson = {
            type: "Point",
            coordinates: [coordinates.layer._latlng.lng, coordinates.layer._latlng.lat],
            properties: {}
        };
        return geojson;
    }


    ns.RouteDrawView = Backbone.View.extend({
        el: '#mapContainer',
        // el: "#mapAndControlsContainer",
        drawMarkerTool: undefined,
        draw: false,
        routeModel: undefined,
        modelToPosition: undefined,
        markers: [],
        routingEnabled: true,
        snappingEnabled: true,

        events: {
            // Events are no longer in context of view, need to set them up in initialize()
            // 'click #startDraw': 'toggleDraw',
            // 'click [data-route-draw-toggle-routing]': 'toggleRouting',
            // 'click [data-route-direction-option]': 'setRouteDirection',
            // 'click [data-action="route-draw-reset"]': 'routeDrawReset'
        },

        initialize: function () {

            this.snapLayer = createSnapLayer();
            this.drawControl = createDrawControl();
            this.poiCollection = this.model.get('poiCollection');
            this.pictureCollection = this.model.get("pictureCollection");
            this.routeModel = this.model.get("route");
            _.bindAll(this, 'startPicturePositioning', 'startPoiPositioning', 'registerPopover', 'zoomAndCenter', 'addGeoJsonToLayer', 'loadGpxGeometry', 'renderDrawButton', 'toggleSnapping', 'toggleRouting', 'showPicturePosition');
            this.routeModel.on("geojson:add", this.addGeoJsonToLayer);
            this.event_aggregator.on("map:loadGpxGeometry", this.loadGpxGeometry);
            this.event_aggregator.on("map:positionPicture", this.startPicturePositioning);
            this.event_aggregator.on("map:showPicturePosition", this.showPicturePosition);
            this.event_aggregator.on("map:positionPoi", this.startPoiPositioning);
            this.event_aggregator.on("map:showPopup", this.registerPopover);
            this.event_aggregator.on("map:zoomAndCenter", this.zoomAndCenter);

            $(document).on('click', '#startDraw', $.proxy(this.toggleDraw, this));
            $(document).on('click', '[data-route-draw-toggle-routing]', $.proxy(this.toggleRouting, this));
            $(document).on('click', '[data-route-direction-option]', $.proxy(this.setRouteDirection, this));
            $(document).on('click', '[data-action="route-draw-reset"]', $.proxy(this.routeDrawReset, this));

        },

        toggleDraw: function (e) {
            e.preventDefault();
            this.draw = !this.draw;
            this.routing.enable(this.draw);

            this.renderDrawButton();

            if (!this.draw) {
                this.setRouteModelGeoJsonFromMap();
            }
        },

        renderDrawButton: function () {
            // var $drawButton = this.$('button#startDraw');
            var $drawButton = $('button#startDraw');

            if (this.draw === true) {
                $drawButton.addClass('active');
                $drawButton.find('.buttonText').html('&nbsp;Avslutt inntegning');
            } else {
                var geojson = this.routing.getGeoJson();
                $drawButton.removeClass("active");
                var label = "&nbsp;Start inntegning";
                if (geojson.coordinates.length > 0) {
                    label = "&nbsp;Fortsett inntegning";
                }
                $drawButton.find(".buttonText").html(label);
                this.routeModel.set({geojson: geojson});
            }
        },

        setRouteModelGeoJsonFromMap: function () {
            var geojson = this.routing.getGeoJson();
            this.routeModel.set({geojson: geojson});
        },

        setRouteDirection: function (e) {
            e.preventDefault();
            var selectedDirection = $(e.currentTarget).attr('data-route-direction-option');
            this.routeModel.set('retning', selectedDirection);
            this.updateRouteDirectionSelect();
        },

        toggleRouting: function (e) {
            e.preventDefault();
            this.routingEnabled = !this.routingEnabled;
            this.routing.enableSnapping(this.routingEnabled);
            this.updateRoutingToggle();
        },

        updateRoutingToggle: function () {
            if (this.routingEnabled === true) {
                // $('[data-route-draw-toggle-routing]').addClass('active'); // This is for options dropdown.
                $('[data-route-draw-toggle-routing] input[type="checkbox"]').prop('checked', true);
            } else {
                // $('[data-route-draw-toggle-routing]').removeClass('active'); // This is for options dropdown.
                $('[data-route-draw-toggle-routing] input[type="checkbox"]').prop('checked', false);
            }
        },

        toggleSnapping: function (e) {
            e.preventDefault();
            this.snappingEnabled = !this.snappingEnabled;
            this.routing.enableSnapping(this.snappingEnabled);
            // this.updateSnappingToggle();
        },

        updateRouteDirectionSelect: function () {
            var routeDirection = this.routeModel.get('retning') || '';
            $('[data-route-direction-option]').removeClass('active');
            $('[data-route-direction-option="' + routeDirection.toLowerCase() + '"]').addClass('active');

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

        routeDrawReset: function (e) {
            this.event_aggregator.trigger('map:routeReset');
        },

        addOnDrawCreatedEventHandler: function () {
            this.mapView.map.on('draw:created', this.createPoiOrPositionPicture, this);
        },

        createPoiOrPositionPicture: function (coordinates) {
            console.log('mapView:createPoiOrPositionPicture');
            if (!!this.modelToPosition) {
                this.setupMarker(coordinates);
            }
        },

        setupMarker: function (coordinates) {
            var model = this.modelToPosition;
            delete this.modelToPosition;
            this.drawMarkerTool.disable();
            this.listenTo(model, 'registerPopover', this.registerPopover);
            var geojson = createGeojson(coordinates);
            model.set('geojson', geojson);
            this.event_aggregator.trigger('map:markerIsCreated', model);
        },

        registerPopover: function (options) {
            // console.log('mapView:registerPopover');
            new ns.PopoverView(options).render();
        },

        addRouting: function () {
            var routing = new ns.Routing(this.mapView.map, this.snapLayer);
            routing.addRouting();
            routing.enableSnapping(true);

            this.routing = routing;
        },

        createDrawMarkerTool: function () {
            this.drawMarkerTool = new L.Draw.Marker(this.mapView.map, {
                icon: createIconConfig()
            });
        },

        moveMap: function (options, callback) {
            // Set the height of mapAndControlsContainerHeight to the height it already has,
            // but as a style attribute, to avoid collapsing when moving map to modal.
            // this.$el.height(this.$el.height());
            $('mapAndControlsContainer').height($('mapAndControlsContainer').height());

            // this.$('#mapAndControls').appendTo('#modal-map .modal-body');
            $('#mapAndControls').appendTo('#modal-map .modal-body');

            $('#modal-map').modal('show');

            $('#modal-map').on('hidden.bs.modal', $.proxy(function (e) {
                // $('#mapAndControls').appendTo(this.$el);
                $('#mapAndControls').appendTo($('#mapAndControlsContainer'));
                this.drawMarkerTool.disable();
            }, this));
        },

        startPicturePositioning: function (picture) {
            this.moveMap();
            if (!picture.hasMarker()) {
                this.modelToPosition = picture;
                this.drawMarkerTool.enable();
            }
        },

        showPicturePosition: function (picture) {

            var mapShowCallback = function (picture) {
                // this.mapView.map.panTo(picture.marker.getLatLng(), { animate: true }); // Using autoPan
                picture.marker.openPopup().update();
                $('#modal-map').off('shown.bs.modal'); // Remove event listener
            };

            var mapHideCallback = function (picture) {
                picture.marker.closePopup();
                $('#modal-map').off('hidden.bs.modal'); // Remove event listener
            };

            // Need to delay the popup showing until after the modal is shown, to prevent messed up popup layout.
            $('#modal-map').on('shown.bs.modal', $.proxy(mapShowCallback, this, picture));

            // Listen to modal hide event, to close popup
            $('#modal-map').on('hidden.bs.modal', $.proxy(mapHideCallback, this, picture));

            this.moveMap();

        },

        loadGpxGeometry: function (gpxGeometry) {
            this.addGeoJsonToLayer(gpxGeometry);
            var geoJson = this.routing.getGeoJson();
            this.routeModel.set('geojson', geoJson);
        },

        addGeoJsonToLayer: function (geoJson) {
            geoJson = geoJson || this.routeModel.get('geojson');
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

        startPoiPositioning: function (poi) {
            this.moveMap();
            this.modelToPosition = poi;
            this.drawMarkerTool.enable();
        },

        zoomAndCenter: function (latlng, zoomLevel) {
            if (!!latlng) {
                if (!zoomLevel) {
                    zoomLevel = 13;
                }
                this.mapView.map.setView(latlng, zoomLevel);
            }
        },

        initMap: function () {
            // this.mapView.map = L.map(this.$('#mapContainer')[0], {

            this.mapView = new ns.MapView({model: this.model.get('route')});
            this.mapView.render();

            L.control.layers(this.mapView.mapLayers.baseLayerConf, this.mapView.mapLayers.overlayConf, {
                position: 'topleft'
            }).addTo(this.mapView.map);

            this.snapLayer.addTo(this.mapView.map);
            this.addRouting();

            this.mapView.map.addControl(this.drawControl);

            this.poiCollection.getGeoJsonLayer().addTo(this.mapView.map);
            this.pictureCollection.getGeoJsonLayer().addTo(this.mapView.map);

            this.addOnDrawCreatedEventHandler();

            this.createDrawMarkerTool();

            this.addGeoJsonToLayer();

            this.routing.routing.on('routing:routeWaypointEnd', this.setRouteModelGeoJsonFromMap, this); // TODO: Handle routing event in DNT.Routing?


        },

        initPopovers: function () {
            this.poiCollection.each($.proxy(function(element, index, list){
                this.registerPopover({model: element, templateId: '#poiPopupTemplate'});
                this.listenTo(element, 'registerPopover', this.registerPopover);
            }, this));

            this.pictureCollection.each($.proxy(function(element, index, list){
                this.registerPopover({model: element, templateId: '#picturePopupTemplate'});
                this.listenTo(element, 'registerPopover', this.registerPopover);
            }, this));

        },

        render: function () {

            this.initMap();
            this.initPopovers();

            this.updateRoutingToggle();
            this.updateRouteDirectionSelect();

            this.renderDrawButton();

            return this;
        }
    });

}(DNT));
