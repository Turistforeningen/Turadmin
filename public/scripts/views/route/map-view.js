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
            iconUrl: '/images/poi/21.png',
            iconRetinaUrl: '/images/poi/21@2x.png',
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


    ns.MapView = Backbone.View.extend({

        el: "#mapAndControlsContainer",
        drawMarkerTool: undefined,
        draw: false,
        routeModel: undefined,
        modelToPosition: undefined,
        markers: [],
        routingEnabled: true,
        snappingEnabled: true,

        events: {
            'click #startDraw': 'toggleDraw',
            // 'click [data-route-draw-toggle-snapping]': 'toggleSnapping',
            'click [data-route-draw-toggle-routing]': 'toggleRouting',
            // 'click [data-route-draw-toggle-autocenter]': 'toggleAutocenter',
            'click [data-route-direction-option]': 'setRouteDirection',
            'click #deleteRoute': 'deleteRoute'
        },

        initialize: function () {
            this.mapLayers = createMapLayers();
            this.snapLayer = createSnapLayer();
            this.drawControl = createDrawControl();
            this.poiCollection = this.model.get("poiCollection");
            this.pictureCollection = this.model.get("pictureCollection");
            this.routeModel = this.model.get("route");
            _.bindAll(this, 'startPicturePositioning', 'startPoiPositioning', 'registerPopover', 'zoomAndCenter', 'addGeoJsonToLayer', 'loadGpxGeometry', 'renderDrawButton', 'toggleSnapping', 'toggleRouting');
            this.routeModel.on("geojson:add", this.addGeoJsonToLayer);
            this.event_aggregator.on("map:loadGpxGeometry", this.loadGpxGeometry);
            this.event_aggregator.on("map:positionPicture", this.startPicturePositioning);
            this.event_aggregator.on("map:positionPoi", this.startPoiPositioning);
            this.event_aggregator.on("map:showPopup", this.registerPopover);
            this.event_aggregator.on("map:zoomAndCenter", this.zoomAndCenter);
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
            var $drawButton = this.$('button#startDraw');

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

        // updateSnappingToggle: function () {
        //     if (this.snappingEnabled === true) {
        //         $('[data-route-draw-toggle-snapping]').addClass('active');
        //     } else {
        //         $('[data-route-draw-toggle-snapping]').removeClass('active');
        //     }
        // },

        toggleAutocenter: function (e) {
            e.preventDefault();
        },

        updateAutocenterToggle: function () {},

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

        deleteRoute: function (e) {
            e.preventDefault();
        },

        addOnDrawCreatedEventHandler: function () {
            this.map.on('draw:created', this.createPoiOrPositionPicture, this);
        },

        createPoiOrPositionPicture: function (coordinates) {
            console.log('mapView:createPoiOrPositionPicture');
            if (!!this.modelToPosition) {
                this.setupMarker(coordinates);
            }
        },

        setupMarker: function (coordinates) {
            // console.log('mapView:setupMarker');
            var model = this.modelToPosition;
            delete this.modelToPosition;
            this.drawMarkerTool.disable();
            this.listenTo(model, 'registerPopover', this.registerPopover); // TEMP: This is where the mapView is signing up for registerPopover-event. Not being run on page load.
            var geojson = createGeojson(coordinates);
            model.set('geojson', geojson);
            this.event_aggregator.trigger('map:markerIsCreated', model);
        },

        registerPopover: function (options) {
            // console.log('mapView:registerPopover');
            new ns.PopoverView(options).render();
        },

        addRouting: function () {
            var routing = new ns.Routing(this.map, this.snapLayer);
            routing.addRouting();
            routing.enableSnapping(true);

            this.routing = routing;
        },

        createDrawMarkerTool: function () {
            this.drawMarkerTool = new L.Draw.Marker(this.map, {
                icon: createIconConfig()
            });
        },

        moveMap: function () {
            // Set the height of mapAndControlsContainerHeight to the height it already has,
            // but as a style attribute, to avoid collapsing when moving map to modal.
            this.$el.height(this.$el.height());

            this.$('#mapAndControls').appendTo('#modal-map .modal-body');
            $('#modal-map').modal('show');

            $('#modal-map').on('hidden.bs.modal', $.proxy(function (e) {
                $('#mapAndControls').appendTo(this.$el);
                this.drawMarkerTool.disable();
            }, this));
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

        startPicturePositioning: function (picture) {
            this.moveMap();
            if (!picture.hasMarker()) {
                this.modelToPosition = picture;
                this.drawMarkerTool.enable();
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
                this.map.setView(latlng, zoomLevel);
            }
        },

        render: function () {

            this.map = L.map(this.$("#mapContainer")[0], {
                layers: [this.mapLayers.baseLayerConf["Topo 2"]],
                scrollWheelZoom: false
            }).setView([61.5, 9], 13);

            L.control.layers(this.mapLayers.baseLayerConf, this.mapLayers.overlayConf, {
                position: 'topleft'
            }).addTo(this.map);

            var map = this.map, snapping = this.snapLayer;

            this.snapLayer.addTo(this.map);
            this.addRouting();

            this.map.addControl(this.drawControl);
            this.poiCollection.getGeoJsonLayer().addTo(this.map);
            this.pictureCollection.getGeoJsonLayer().addTo(this.map);
            this.addOnDrawCreatedEventHandler();
            this.createDrawMarkerTool();
            // this.updateAutocenterToggle();
            // this.updateSnappingToggle();
            this.updateRoutingToggle();
            this.updateRouteDirectionSelect();

            this.addGeoJsonToLayer();

            this.poiCollection.each($.proxy(function(element, index, list){
                this.registerPopover({model: element, templateId: "#poiPopupTemplate"});
                this.listenTo(element, 'registerPopover', this.registerPopover);
            }, this));

            this.pictureCollection.each($.proxy(function(element, index, list){
                this.registerPopover({model: element, templateId: "#picturePopupTemplate"});
                this.listenTo(element, 'registerPopover', this.registerPopover);
            }, this));

            this.renderDrawButton();
            this.routing.routing.on('routing:routeWaypointEnd', this.setRouteModelGeoJsonFromMap, this); // TODO: Handle routing event in DNT.Routing?

            return this;
        }
    });

}(DNT));
