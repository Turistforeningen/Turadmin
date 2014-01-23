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
        })
    }


    ns.MapView = Backbone.View.extend({

        el: "#routePage",

        snapping: true,

        drawMarkerTool: undefined,

        draw: false,

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
            this.poiCollection = new DNT.PoiCollection();
        },

        toggleDraw: function (e) {
            this.draw = !this.draw;
            this.routing.enable(this.draw);
            if (this.draw === true) {
                $(e.currentTarget).addClass("active");
                $(e.currentTarget).find(".buttonText").html("Avslutt inntegning");
            } else {
                var geojson = this.routing.getGeojson();
                $(e.target).removeClass("active");
                var label = "Start inntegning";
                if (geojson.coordinates.length > 0) {
                    label = "Fortsett inntegning";
                }
                $(e.currentTarget).find(".buttonText").html(label);
                this.model.set({geojson: geojson});
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

        addNewPoi: function (e) {
            if ($(e.currentTarget).hasClass("active")) {
                this.disableDrawNewPoi();
            } else {
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
                this.createPoi,
                this);
        },

        createPoi: function (coordinates) {
            this.disableDrawNewPoi();
            var geojson = {
                type: "Point",
                coordinates: [coordinates.layer._latlng.lng, coordinates.layer._latlng.lat],
                properties: {}
            };
            var poi = new DNT.Poi({ geojson: geojson });
            this.listenTo(poi, "registerPopup", this.showPopup);
            this.poiCollection.add(poi);
        },

        showPopup: function (poi) {
            new DNT.PopupView({model: poi}).render();
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

        render: function () {
            this.map = L.map(this.$("#mapContainer")[0], {layers: [this.mapLayers.baseLayerConf["Topo 2"]]}).setView([61.5, 9], 13);
            L.control.layers(this.mapLayers.baseLayerConf, this.mapLayers.overlayConf, {
                position: 'topleft'
            }).addTo(this.map);
            this.snapping.addTo(this.map);
            this.addRouting();
            this.map.addControl(this.drawControl);
            this.poiCollection.getGeoJsonLayer().addTo(this.map);
            this.addOnDrawCreatedEventHandler();
            this.createDrawMarkerTool();
            return this;
        }
    });
}(DNT));
