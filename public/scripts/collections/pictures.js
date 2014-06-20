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

        removedModels: [],

        comparator: function (model) {
            return model.get("ordinal");
        },

        initialize: function () {
            this.nextOrdinal = 0;
            // this.geojsonLayer = new L.GeoJSON(null, {});
            this.on('add', this.modelAdded, this);
            this.on('remove', this.onRemove, this);
            // this.on("picture:markerCreated", this.addMarker, this);
        },

        onRemove: function (model) {
            this.removedModels.push(model);
        },
        // getGeoJsonLayer: function () {
        //     return this.geojsonLayer;
        // },

        // getNewGeoJsonLayer: function () {
        //     this.geojsonLayer = new L.GeoJSON(null);
        //     this.each($.proxy(function(element, index, list){
        //         if (element.hasPosition()) {
        //             element.createMarker(element.get('geojson'));
        //             this.geojsonLayer.addLayer(element.getMarker());
        //         }
        //     }, this));
        //     return this.geojsonLayer;
        // },

        getNextOrdinal: function () {
            this.nextOrdinal = this.nextOrdinal + 1;
            return this.nextOrdinal - 1;
        },

        modelAdded: function (model) {
            // if (model.hasPosition()) {
            //     this.geojsonLayer.addLayer(model.getMarker());
            // }
            model.on("deletePicture", function () { this.deletePicture(model); }, this); // deletePicture is fired from picture model.
        },

        // addMarker: function (model) {
        //     console.log('pictures:addMarker');
        //     if (model.hasPosition()) {
        //         // this.geojsonLayer.addLayer(model.getMarker());
        //         this.getGeoJsonLayer().addLayer(model.getMarker());
        //     }
        // },

        deletePicture: function (model) {
            // if (model.isDeleted && model.hasPosition()) {
            //     this.getGeoJsonLayer().removeLayer(model.getMarker());
            // }
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
                console.log('pictures aftersave');
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

            var allPicturesCount = this.length + this.removedModels.length;

            if (allPicturesCount === 0) {
                success.call(self);

            } else {

                console.log('allPicturesCount', allPicturesCount);
                var saveDone = _.after(allPicturesCount, afterSave);

                if (this.removedModels.length) {
                    _.each(this.removedModels, function (picture) {
                         picture.destroy({
                            wait: true,
                            success: function () {
                                saveDone();
                            },
                            error: function () {
                                saveErrorCount += 1;
                                saveDone();
                            }
                        });
                    });
                }

                _.each(this.models, function (picture) {

                    picture.save(undefined, {
                        wait: true,
                        success: function (model, response, options) {
                            saveDone();
                        },
                        error: function (model, response, options) {
                            saveErrorCount += 1;
                            saveDone();
                        }
                    });
                });
            }
        }
    });

}(DNT));
