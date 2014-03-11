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
            iconUrl: 'images/poi/21.png',
            iconRetinaUrl: 'images/poi/21@2x.png',
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

        snapping: true,

        drawMarkerTool: undefined,

        draw: false,

        routeModel: undefined,

        modelToPosition: undefined,

        events: {
            'click #startDraw': 'toggleDraw',
            'click [data-route-draw-toggle-snap]': 'toggleSnap',
            'click [data-route-draw-toggle-autocenter]': 'toggleAutocenter',
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
            _.bindAll(this, "startPicturePositioning", "startPoiPositioning", "registerPopup", "zoomAndCenter", "addGeoJSONToLayer");
            this.routeModel.on("geojson:add", this.addGeoJSONToLayer);
            this.event_aggregator.on("map:positionPicture", this.startPicturePositioning);
            this.event_aggregator.on("map:positionPoi", this.startPoiPositioning);
            this.event_aggregator.on("map:showPopup", this.registerPopup);
            this.event_aggregator.on("map:zoomAndCenter", this.zoomAndCenter);
        },

        toggleDraw: function (e) {
            e.preventDefault();
            this.draw = !this.draw;
            this.routing.enable(this.draw);
            if (this.draw === true) {
                $(e.currentTarget).addClass("active");
                $(e.currentTarget).find(".buttonText").html("Avslutt inntegning");
            } else {
                var geojson = this.routing.getGeojson();
                $(e.currentTarget).removeClass("active");
                var label = "Start inntegning";
                if (geojson.coordinates.length > 0) {
                    label = "Fortsett inntegning";
                }
                $(e.currentTarget).find(".buttonText").html(label);
                this.routeModel.set({geojson: geojson});
            }
        },

        setRouteDirection: function (e) {
            e.preventDefault();
            var selectedDirection = $(e.currentTarget).attr('data-route-direction-option');
            this.retning = selectedDirection;
            this.updateRouteDirectionSelect();
        },

        toggleSnap: function (e) {
            e.preventDefault();
            this.snapping = !this.snapping;
            this.routing.enableSnapping(this.snapping);
            this.updateSnapToggle();
        },

        updateSnapToggle: function () {
            if (this.snapping === true) {
                $('[data-route-draw-toggle-snap]').addClass("active");
            } else {
                $('[data-route-draw-toggle-snap]').removeClass("active");
            }
        },

        toggleAutocenter: function (e) {
            e.preventDefault();
            // this.autocenter = !this.autocenter;
            // this.routing.enableSnapping(this.snapping);
            // this.updateSnapToggle();
        },

        updateAutocenterToggle: function () {
            // if (this.snapping === true) {
            //     $('[data-route-draw-toggle-snap]').addClass("active");
            // } else {
            //     $('[data-route-draw-toggle-snap]').removeClass("active");
            // }
        },

        updateRouteDirectionSelect: function () {
            var routeDirection = this.retning || '';
            $('[data-route-direction-option]').removeClass('active');
            $('[data-route-direction-option="' + routeDirection.toLowerCase() + '"]').addClass('active');
        },

        deleteRoute: function (e) {
            e.preventDefault();
        },

        addOnDrawCreatedEventHandler: function () {
            this.map.on('draw:created', this.createPoiOrPositionPicture, this);
        },

        createPoiOrPositionPicture: function (coordinates) {
            if (!!this.modelToPosition) {
                this.setupMarker(coordinates);
            }
        },

        setupMarker: function (coordinates) {
            var model = this.modelToPosition;
            delete this.modelToPosition;
            this.drawMarkerTool.disable();
            this.listenTo(model, "registerPopup", this.registerPopup);
            var geojson = createGeojson(coordinates);
            model.set("geojson", geojson);
            this.event_aggregator.trigger("map:markerIsCreated", model);
        },

        registerPopup: function (options) {
            new DNT.PopupView(options).render();
        },

        addRouting: function () {
            var routing = new DNT.Routing(this.map, this.snapLayer);
            routing.addRouting();
            routing.enableSnapping(true);
            this.routing = routing;
        },

        createDrawMarkerTool: function () {
            this.drawMarkerTool = new L.Draw.Marker(this.map, {
                icon : createIconConfig()
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

        addGeoJSONToLayer: function () {
            var geoJSON = this.routeModel.get("geojson");
            if (!!geoJSON && !!geoJSON.properties) {
                this.routing.loadGeoJSON(geoJSON);
            } else {
                console.warn('GeoJSON is not found, or does not have a properties property.')
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

            this.snapLayer.addTo(this.map);
            this.addRouting();
            this.map.addControl(this.drawControl);
            this.poiCollection.getGeoJsonLayer().addTo(this.map);
            this.pictureCollection.getGeoJsonLayer().addTo(this.map);
            this.addOnDrawCreatedEventHandler();
            this.createDrawMarkerTool();
            this.updateAutocenterToggle();
            this.updateSnapToggle();
            this.updateRouteDirectionSelect();

            this.addGeoJSONToLayer();

            return this;
        }
    });

}(DNT));
