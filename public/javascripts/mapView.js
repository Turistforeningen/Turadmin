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

        el: "#mapAndControls",

        snapping: true,

        drawMarkerTool: undefined,

        draw: false,

        routeModel: undefined,

        pictureToPosition: undefined,

        events: {
            'click #startDraw': 'toggleDraw',
            'click #toggleSnap': 'toggleSnap',
            'click #deleteRoute': 'deleteRoute',
            'click #newPoi': 'addNewPoi'
        },

        initialize: function () {
            this.mapLayers = createMapLayers();
            this.snapping = createSnapLayer();
            this.drawControl = createDrawControl();
            this.poiCollection = this.model.get("poiCollection");
            this.pictureCollection = this.model.get("pictureCollection");
            this.routeModel = this.model.get("route");
            _.bindAll(this, "startPicturePositioning");
            _.bindAll(this, "registerPopup");
            this.event_aggregator.on("map:positionPicture", this.startPicturePositioning);
            this.event_aggregator.on("map:showPopup", this.registerPopup);
        },

        toggleDraw: function (e) {
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

        toggleSnap: function (e) {
            this.snapping = !this.snapping;
            this.routing.enableSnapping(this.snapping);
            if (this.snapping) {
                $(e.currentTarget).parent().addClass("active");
            } else {
                $(e.currentTarget).parent().removeClass("active");
            }
        },

        deleteRoute: function (e) {

        },

        addNewPoi: function (e) {
            if ($(e.currentTarget).hasClass("active")) {
                this.disableDrawNewPoi();
            } else {
                delete this.pictureToPositon;
                $(e.currentTarget).addClass("active");
                this.drawMarkerTool.enable();
            }
        },

        disableDrawNewPoi: function (e) {
            this.$("#newPoi").removeClass("active");
            this.drawMarkerTool.disable();
        },

        addOnDrawCreatedEventHandler: function () {
            this.map.on('draw:created',
                this.createPoiOrPositionPicture,
                this);
        },

        createPoiOrPositionPicture: function (coordinates) {
            if (this.pictureToPosition) {
                this.positionPicture(coordinates);
            } else {
                this.createPoi(coordinates);
            }
        },

        createPoi: function (coordinates) {
            this.disableDrawNewPoi();
            var geojson = createGeojson(coordinates);
            var poi = new DNT.Poi({ geojson: geojson });
            this.listenTo(poi, "registerPoiPopup", this.registerPopup);
            this.poiCollection.add(poi);
        },

        positionPicture: function (coordinates) {
            var picture = this.pictureToPosition;
            delete this.pictureToPosition;
            this.drawMarkerTool.disable();
            var geojson = createGeojson(coordinates);
            picture.set("geojson", geojson);
            this.listenTo(picture, "registerPicturePopup", this.registerPopup);
            picture.createMarker();

        },

        registerPopup: function (options) {
            new DNT.PopupView(options).render();
        },

        addRouting: function () {
            var routing = new DNT.Routing(this.map, this.snapping);
            routing.addRouting();
            routing.enableSnapping(true);
            this.routing = routing;
        },

        createDrawMarkerTool: function () {
            this.drawMarkerTool = new L.Draw.Marker(this.map,
                {
                    icon : createIconConfig()
                });
        },

        startPicturePositioning: function (picture) {
            this.pictureToPosition = picture;
            this.drawMarkerTool.enable();
        },

        render: function () {
            this.map = L.map(this.$("#mapContainer")[0], {layers: [this.mapLayers.baseLayerConf["Topo 2"]]}).setView([61.5, 9], 13);
            L.control.layers(this.mapLayers.baseLayerConf, this.mapLayers.overlayConf, {
                position: 'topleft'
            }).addTo(this.map);
            this.snapping.addTo(this.map);
            this.addRouting();
            this.map.addControl(this.drawControl);
            this.poiCollection.getGeoJsonLayer().addTo(this.map);
            this.pictureCollection.getGeoJsonLayer().addTo(this.map);
            this.addOnDrawCreatedEventHandler();
            this.createDrawMarkerTool();
            return this;
        }
    });
}(DNT));
