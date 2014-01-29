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
            this.geojsonLayer = new L.GeoJSON(null);
            this.on("add", this.modelAdded, this);
        },

        getGeoJsonLayer: function () {
            return this.geojsonLayer;
        },

        modelAdded: function (model) {
            model.on("deletePoi", function () { this.deletePoi(model); }, this);
            this.geojsonLayer.addLayer(model.getMarker());
        },

        deletePoi: function (model) {
            if (model.isDeleted) {
                this.getGeoJsonLayer().removeLayer(model.getMarker());
            }
            //If model is new (not synced with server) - silently remove it from the collection
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

            var unsyncedPois = this.filter(function (poi) {
                return poi.isNew() || poi.hasChanged() || poi.isDeleted();
            });

            var saveDone = _.after(unsyncedPois.length, afterSave);

            _.each(unsyncedPois, function (poi) {
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

