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
        Backbone = require('backbone');

    // Module
    return Backbone.Collection.extend({

        // NOTE: DO NOT define properties that should not be shared
        // between collections extending this collection, like removedModels

        state: {
            pageSize: 20,
            currentPage: 1,
            paginatorRequired: false
        },

        // Order models by date changed, descending
        comparator: function(model) {
            var date = new Date(model.get('endret'));
            return -date;
        },

        parse: function (resp, options) {
            var records = resp.documents || [];
            this.setState(resp);
            return records;
        },

        constructor: function() {
            // To be able to iterate on auto-added models.
            // See https://github.com/jashkenas/backbone/issues/814#issuecomment-4577128
            Backbone.Collection.prototype.constructor.apply(this, arguments);

            this.each($.proxy(function (element, index, list) {
                this.onAdd(element);
            }, this));
        },

        initialize: function (models) {
            this.on('add', this.onAdd, this);
            this.on('remove', this.onRemove, this);
        },


        // Getters and setters

        setState: function (resp) {
            this.state.totalRecords = resp.total;

            var nextPageSkip = this.state.pageSize * this.state.currentPage;
            this.state.nextPageSkip = (nextPageSkip >= this.state.totalRecords) ? false : nextPageSkip;

            var prevPageSkip = (this.state.pageSize * this.state.currentPage) - (this.state.pageSize * 2);
            this.state.prevPageSkip = (prevPageSkip < 0) ? false : prevPageSkip;

            this.state.totalPages = Math.ceil((this.state.totalRecords / this.state.pageSize));

            this.state.paginatorRequired = (this.state.totalRecords > this.state.pageSize) ? true : false;
        },

        setPublished: function () {
            this.each(function (model, index) {
                model.setPublished();
            });
        },

        setUnpublished: function () {
            this.each(function (model, index) {
                model.setUnpublished();
            });
        },


        // Event triggered methods

        onAdd: function (model) {
            model.on('change:removed', function (model) {
                if (model.get('removed') === true) {
                    this.remove(model);
                }
            }, this);
        },

        onRemove: function (model) {
            // Add to removedModels if saved to server, to send a DELETE request when collection is saved
            // IF option destroyRemoved === true is passed to collection save method
            if (!!model.get('_id')) {
                this.removedModels.push(model);
            }
        },


        // Server interactions

        save: function (success, error, self, options) {

            options = options || {};
            var relatedCollection = options.relatedCollection;

            var saveErrorCount = 0;

            var afterSave = function () {
                if (saveErrorCount > 0) {
                    if (error) {
                        error.call(self, saveErrorCount, relatedCollection);
                    } else {
                        console.error("Error saving models! " + saveErrorCount + " models could not be saved.");
                    }
                } else {
                    if (success) {
                        success.call(self, relatedCollection);
                    }
                }
            };

            var allModelsCount = this.length + this.removedModels.length;

            if (allModelsCount === 0) {
                success.call(self);

            } else {
                var saveDone = _.after(allModelsCount, afterSave);

                if (this.removedModels.length) {

                    if (options.destroyRemoved === true) {

                        _.each(this.removedModels, function (model, index, list) {

                            model.destroy({
                                wait: true,
                                success: $.proxy(function (model) {
                                    var removedModelIndex = this.removedModels.indexOf(model);
                                    if (removedModelIndex !== -1) {
                                        this.removedModels.splice(removedModelIndex, 1);
                                    }
                                    saveDone();
                                }, this),
                                error: function () {
                                    saveErrorCount += 1;
                                    saveDone();
                                }
                            });
                        }, this);

                    } else {

                        for (var i = 0; i < this.removedModels.length; i++) {
                            saveDone();
                        }

                    }

                }

                _.each(this.models, function (model) {
                    // console.log('Saving model', model.get('_id'));

                    model.save(undefined, {
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
