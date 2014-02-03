/*
 * Copyright (c) $year, Den Norske Turistforening (DNT)
 *
 * https://github.com/Turistforeningen/turadmin
 */

var DNT = window.DNT || {};

(function (ns) {
    "use strict";

    var apiUri = function () {
        return "/restProxy/bilder";
    };

    ns.PictureCollection = Backbone.Collection.extend({

        url: function () {
            return apiUri();
        },

        model: ns.Picture,

        initialize: function () {
            this.geojsonLayer = new L.GeoJSON(null, {
            });
            this.on("add", this.modelAdded, this);
            this.on("picture:markerCreated", this.addMarker, this);
        },

        getGeoJsonLayer: function () {
            return this.geojsonLayer;
        },

        modelAdded: function (model) {
            if (model.hasPosition()) {
                this.geojsonLayer.addLayer(model.getMarker());
            }
            model.on("deletePicture", function () { this.removePicture(model); }, this);
        },

        addMarker: function (model) {
            if (model.hasPosition()) {
                this.geojsonLayer.addLayer(model.getMarker());
            }
        },

        removePicture: function (model) {
            if (model.isDeleted && model.hasPosition()) {
                this.getGeoJsonLayer().removeLayer(model.getMarker());
            }
            //If model is new (not synced with server) - silently remove it from the collection
            if (model.isNew()) {
                this.remove(model, {silent: true});
            }
        },

        countPictures: function () {
            var count  = this.filter(function (picture) {
                return !picture.isDeleted();
            });
            return count.length;
        },

        save: function (success, error, self) {
            var saveErrorCount = 0;
            var newIds = [];
            var removedIds = [];

            var afterSave = function () {
                if (saveErrorCount > 0) {
                    if (error) {
                        error.call(self, saveErrorCount);
                    } else {
                        console.error("Error saving pictures! " + saveErrorCount + " pictures could not saved");
                    }
                } else {
                    if (success) {
                        success.call(self, newIds, removedIds);
                    }
                }
            };

            var syncablePictures = this.filter(function (picture) {
                return picture.isNew() || picture.hasChanged() || picture.isDeleted();
            });

            var saveDone = _.after(syncablePictures.length, afterSave);

            if (syncablePictures.length === 0) {
                afterSave();
            }

            _.each(syncablePictures, function (picture) {
                if (picture.isDeleted()) {
                    removedIds.push(picture.get("_id"));
                    picture.destroy({
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
                    var isNew = picture.isNew();
                    picture.save(undefined, {
                        success : function () {
                            picture.resetHasChanged();
                            if (isNew) {
                                newIds.push(picture.get("_id"));
                            }
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

