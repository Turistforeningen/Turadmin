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

        save: function (success, error, self) {
            var saveErrorCount = 0;

            var afterSave = function () {
                if (saveErrorCount > 0) {
                    if (error) {
                        error.call(self, saveErrorCount);
                    } else {
                        console.error("Error saving pois! " + saveErrorCount + " pois could not saved");
                    }
                } else {
                    if (success) {
                        success.call(self);
                    }
                }
            };

            var newAndChangedPois = this.filter(function (poi) {
                return poi.isNew() || poi.hasChanged() || poi.isDeleted();
            });

            var saveDone = _.after(newAndChangedPois.length, afterSave);

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

