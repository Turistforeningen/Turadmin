/*
 * Copyright (c) $year, Den Norske Turistforening (DNT)
 *
 * https://github.com/Turistforeningen/turadmin
 */

define(function (require, exports, module) {
    "use strict";

    // Dependencies
    var $ = require('jquery'),
        _ = require('underscore'),
        Backbone = require('backbone'),
        NtbCollection = require('collections/ntb'),
        Picture = require('models/picture');

    var apiUri = function () {
        return '/restProxy/bilder';
    };

    return Backbone.Collection.extend({

        url: function () {
            return apiUri();
        },

        model: Picture,

        removedModels: [],

        comparator: function (model) {
            return model.get('ordinal');
        },

        initialize: function (pictures) {

            this.on('add', this.onAdd, this);
            this.on('remove', this.onRemove, this);

            this.nextOrdinal = 0;

            NtbCollection.prototype.initialize.call(this, pictures);
        },

        getNextOrdinal: function () {
            this.nextOrdinal = this.nextOrdinal + 1;
            return this.nextOrdinal - 1;
        },

        onAdd: function (model) {
            model.set('ordinal', this.getNextOrdinal());
            model.on('deletePicture', function () { this.deletePicture(model); }, this); // deletePicture is fired from picture model.
        },

        deletePicture: function (model) {
            this.remove(model);
        },

        countPictures: function () {
            var count = this.filter(function (picture) {
                return !picture.isDeleted();
            });
            return count.length;
        },

        reIndex: function (picture, newPosition) {
            console.log('reindexing');
            this.remove(picture, {silent: true}); // NOTE: This causes a bug which removes the picture from POI picture list.
            picture.set('ordinal', newPosition);
            this.each(function (model, index) {
                var ordinal = index;
                if (index >= newPosition) {
                    ordinal = ordinal + 1;
                }
                model.set('ordinal', ordinal);
            });
            this.add(picture, {silent: true, at: newPosition});
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

            var allPicturesCount = this.length + this.removedModels.length;

            if (allPicturesCount === 0) {
                success.call(self);

            } else {
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

});
