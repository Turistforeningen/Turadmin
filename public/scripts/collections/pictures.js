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

        comparator: function (model) {
            return model.get("ordinal");
        },

        initialize: function () {
            this.nextOrdinal = 0;
            this.geojsonLayer = new L.GeoJSON(null, {});
            this.on("add", this.modelAdded, this);
            this.on("picture:markerCreated", this.addMarker, this);
        },

        getGeoJsonLayer: function () {
            return this.geojsonLayer;
        },

        getNewGeoJsonLayer: function () {
            this.geojsonLayer = new L.GeoJSON(null);
            this.each($.proxy(function(element, index, list){
                if (element.hasPosition()) {
                    element.createMarker(element.get('geojson'));
                    this.geojsonLayer.addLayer(element.getMarker());
                }
            }, this));
            return this.geojsonLayer;
        },

        getNextOrdinal: function () {
            this.nextOrdinal = this.nextOrdinal + 1;
            return this.nextOrdinal - 1;
        },

        modelAdded: function (model) {
            if (model.hasPosition()) {
                this.geojsonLayer.addLayer(model.getMarker());
            }
            model.on("deletePicture", function () { this.deletePicture(model); }, this); // deletePicture is fired from picture model.
        },

        addMarker: function (model) {
            if (model.hasPosition()) {
                this.geojsonLayer.addLayer(model.getMarker());
            }
        },

        deletePicture: function (model) {
            if (model.isDeleted && model.hasPosition()) {
                this.getGeoJsonLayer().removeLayer(model.getMarker());
            }
            // NOTE: Keeping this code, in case my fixes for TURADMIN-49 has broken something
            // If model is new (not synced with server) - silently remove it from the collection
            // if (model.isNew()) {
            //     // this.remove(model, { silent: true });
            //     this.remove(model); // NOTE: Removed silently removal, because we want to catch this in poipicturesView
            // }

            this.remove(model);

        },

        countPictures: function () {
            var count  = this.filter(function (picture) {
                return !picture.isDeleted();
            });
            return count.length;
        },

        reIndex: function (picture, newPosition) {
            this.remove(picture, { silent: true }); // NOTE: This causes a bug which removes the picture from POI picture list.
            picture.set("ordinal", newPosition);
            this.each(function (model, index) {
                var ordinal = index;
                if (index >= newPosition) {
                    ordinal = ordinal + 1;
                }
                model.set("ordinal", ordinal);
            });
            this.add(picture, { silent: true, at: newPosition });
            this.sort();
        },

        getPictureIds: function () {
            return this.pluck("_id");
        },

        setPublished: function() {
            this.each(function (model, index) {
                model.setPublished();
            });
        },

        setUnpublished: function() {
            this.each(function (model, index) {
                model.setUnpublished();
            });
        },

        save: function (success, error, self) {
            var saveErrorCount = 0;

            var afterSave = function () {
                if (saveErrorCount > 0) {
                    if (error) {
                        error.call(self, saveErrorCount);
                    } else {
                        console.error("Error saving pictures! " + saveErrorCount + " pictures could not be saved.");
                    }
                } else {
                    if (success) {
                        success.call(self);
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
