/*
 * Copyright (c) $year, Den Norske Turistforening (DNT)
 *
 * https://github.com/Turistforeningen/turadmin
 */

var DNT = window.DNT || {};

(function (ns) {
    "use strict";

    var apiUri = function () {
        return '/restProxy/steder';
    };

    ns.PoiCollection = Backbone.Collection.extend({

        url: function () {
            return apiUri();
        },

        model: ns.Poi,
        removedModels: [],

        initialize: function () {
            this.on('add', this.onAdd, this);
            this.on('remove', this.onRemove, this);
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

        onRemove: function (model) {
            // Add to removedModels if saved to server, to send a DELETE request when route is saved
            if (!!model.get('id')) {
                this.removedModels.push(model);
            }
        },

        onAdd: function (model) {
            model.on('deletePoi', function () {
                this.deletePoi(model);
            }, this);
        },

        deletePoi: function (model) {
            this.remove(model);
        },

        countPois: function () {
            var count  = this.filter(function (poi) {
                return !poi.isDeleted();
            });
            return count.length;
        },

        getPoiIds: function () {
            return this.pluck("_id");
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

            var unsyncedPoisCount = unsyncedPois.length + this.removedModels.length;

            var saveDone = _.after(unsyncedPoisCount, afterSave);

            if (unsyncedPois.length === 0 && this.removedModels.length === 0) {
                afterSave();
            }

            // Delete removed POI's from server
            _.each(this.removedModels, function (poi) {
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
            });

            // Save unsynced POI's
            _.each(unsyncedPois, function (poi) {
                var isNew = poi.isNew();
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
            });
        }
    });
}(DNT));

