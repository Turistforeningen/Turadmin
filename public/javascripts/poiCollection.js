/*
 * Copyright (c) $year, Den Norske Turistforening (DNT)
 *
 * https://github.com/Turistforeningen/turadmin
 */

var DNT = window.DNT || {};

(function (ns) {
    "use strict";

    var apiUri = function () {
        return "/apiProxy/poi/steder";
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
        },

        modelAdded: function (model) {
            model.on("removePoi", function () { this.removeFromLayer(model); }, this);
            this.geojsonLayer.addLayer(model.getMarker());
        },

        removeFromLayer: function (model) {
            if (model.isDeleted) {
                this.getGeoJsonLayer().removeLayer(model.getMarker());
            }
            if (model.isNew()) {
                this.remove(model, {silent: true});
            }
        },

        save: function () {
            var saveErrorCount = 0;

            var doSomething = function () {
                if (saveErrorCount > 0) {
                    alert(saveErrorCount + " poier ble ikke lagret - prøv igjen!");
                }
            };

            var newAndChangedPois = this.filter(function (poi) {
                return poi.isNew() || poi.hasChanged() || poi.isDeleted();
            });

            var saveDone = _.after(newAndChangedPois.length, doSomething);

            _.each(newAndChangedPois, function (poi) {
                if (poi.isDeleted()) {
                    poi.destroy({
                        wait: true,
                        success : function () {
                            saveDone();
                        },
                        error: function () {
                            saveErrorCount += 1;
                            saveDone();
                        }
                    });
                } else {
                    poi.save(undefined, {
                        success : function () {
                            poi.resetHasChanged();
                            saveDone();
                        },
                        error: function () {
                            saveErrorCount += 1;
                            saveDone();
                        }
                    });
                }
            });
        }
    });
}(DNT));

