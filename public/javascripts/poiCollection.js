/*
 * Copyright (c) $year, Den Norske Turistforening (DNT)
 *
 * https://github.com/Turistforeningen/turadmin
 */

var DNT = window.DNT || {};

(function (ns) {
    "use strict";

    var apiUri = function () {
        return "/apiProxy/steder";
    };

    ns.PoiCollection = Backbone.Collection.extend({

        url: function () {
            return apiUri();
        },

        model: ns.Poi,

        initialize: function () {
            this.geojsonLayer = new L.GeoJSON(null, {
                onEachFeature: this.onEachFeature
            });
            this.on("add", this.modelAdded, this);
        },

        getGeoJsonLayer: function () {
            return this.geojsonLayer;
        },

        onEachFeature : function (feature, layer) {
            layer.bindPopup('');

            layer._setPopup = function () {
                this._popup.setContent([
                    '<a href="#" class="poi-move">Flytt</a>',
                    ' | <a href="#" class="poi-edit">Endre</a>',
                    ' | <a href="#" class="poi-delete">Slett</a>'
                ].join(''));
                this.closePopup();
            };

            layer._setIcon = function () {
                this.setIcon(L.icon({
                    iconUrl: 'images/poi/21.png',
                    iconRetinaUrl: 'images/poi/21@2x.png',
                    iconSize: [26, 32],
                    iconAnchor: [13, 32],
                    popupAnchor: [-0, -30]
                }));
            };

            layer.on('dragend', function () {
                this.set('lat', this.getLatLng().lat);
                this.set('lon', this.getLatLng().lng);
                this.save();
                this.dragging.disable();
            });

            layer._setIcon();
            layer._setPopup();
        },

        modelAdded: function (model) {
            var geoJson = model.getGeoJson();
            this.geojsonLayer.addData(geoJson);
        }
    });
}(DNT));

