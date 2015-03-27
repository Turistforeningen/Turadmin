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
        PictureManagerView = require('views/pictures/manager'),
        PictureCollection = require('collections/pictures'),
        MapWrapper = require('views/map/wrapper'),
        Poi = require('models/poi'),
        PoiPositioningView = require('views/pois/positioning'),
        PoiDetailsView = require('views/pois/details');

    require('backbone-stickit');
    require('backbone-validation');
    require('bootstrap');
    require('jquery-ssr');

    // Module
    return Backbone.View.extend({

        el: '[data-view="app"]',

        className: 'editor',

        events: {
            'click [data-action="do-save"]': 'save',
            'click [data-action="do-publish"]': 'publish',
            'click [data-action="do-unpublish"]': 'unpublish'
        },

        initialize: function (options) {
            this.listenTo(this, 'save:start', this.onSaveStart);
            this.listenTo(this, 'save:end', this.onSaveEnd);

            this.listenTo(this.model, 'change:synced', this.onSyncedChange);
        },

        onSyncedChange: function (model, value, options) {

            var synced = value,
                $saveButton = this.$('.navbar [data-action="do-save"]');

            switch (synced) {
                case true:
                    $saveButton.removeClass('has-unsaved-changes');
                    $saveButton.tooltip({title: ''});
                    $saveButton.tooltip('hide');
                    $saveButton.tooltip('disable');
                    $saveButton.removeClass('disabled');
                    break;

                case false:
                    $saveButton.addClass('has-unsaved-changes');
                    $saveButton.tooltip({title: 'Du har gjort endringer som ikke er lagret'});
                    $saveButton.tooltip('enable');
                    break;
            }

        },

        onSaveStart: function (e) {
            this.$('[data-action="do-save"]').addClass('disabled').html('<span class="glyphicon glyphicon-floppy-disk"></span> Lagrer...');
        },

        onSaveEnd: function (e) {
            this.$('[data-action="do-save"]').removeClass('disabled').html('<span class="glyphicon glyphicon-floppy-disk"></span> Lagre');
        },

        updatePublishButtons: function () {

            var status = this.model.get('status');

            switch (status) {
                case 'Kladd':
                    $('.page-block.ntb-done .unpublished').removeClass('hidden');
                    $('.page-block.ntb-done .published').addClass('hidden');

                    $('[data-action="do-publish"]').removeClass('hidden');
                    $('[data-action="do-unpublish"]').addClass('hidden');
                    break;

                case 'Offentlig':
                    $('.page-block.ntb-done .unpublished').addClass('hidden');
                    $('.page-block.ntb-done .published').removeClass('hidden');

                    $('[data-action="do-publish"]').addClass('hidden');
                    $('[data-action="do-unpublish"]').removeClass('hidden');
                    break;
            }
        },

        onSyncChange: function (e) {
            if (this.model.get('synced') === false) {

            }
        },

        toServerJSON: function () {
            return _.pick(this.attributes, this.serverAttrs);
        },

        saveRelated: function (callback) {

            if (typeof this.relatedModels !== 'undefined' && this.relatedModels.length) {
                for (var i = 0; i < this.relatedModels.length; i++) {
                    var relatedModel = this.relatedModels[i];
                    if (typeof relatedModel.field === 'string' && typeof relatedModel.model === 'object') {
                        var relatedModelJson = (typeof relatedModel.model.toServerJSON === 'function') ? relatedModel.model.toServerJSON() : relatedModel.model.toJSON();
                        this.model.set(relatedModel.field, relatedModelJson)
                    }
                }
            }

            if (typeof this.relatedCollections !== 'undefined') {

                var saveDone = _.after(this.relatedCollections.length, $.proxy(callback, this));

                for (var i = 0; i < this.relatedCollections.length; i++) {

                    var relatedCollection = this.relatedCollections[i];
                    // console.log('Saving ' + relatedCollection.field);

                    relatedCollection.collection.save(
                        function (relatedCollection) {
                            if (!!relatedCollection) {
                                // console.log('All ' + relatedCollection.field + ' synced with server');
                                this.model.set(relatedCollection.field, relatedCollection.collection.pluck('_id'));

                            } else {
                                Raven.captureMessage('Unknown relatedCollection was saved. Unable to set related field in model.');
                            }

                            saveDone();
                        },
                        function (errorCount, relatedCollection) {
                            if (!!relatedCollection) {
                                Raven.captureMessage('Failed to sync ' + errorCount + ' ' + relatedCollection.field);

                            } else {
                                Raven.captureMessage('Unknown relatedCollection failed to sync');
                            }

                            saveDone();
                        },
                        this,
                        {
                            destroyRemoved: relatedCollection.destroyRemoved,
                            relatedCollection: relatedCollection
                        }
                    );

                }

            } else {
                callback();
            }

        },

        setPictureNames: function () {
            var objectName = this.model.get('navn'),
                pictureName = 'Bilde';

            if (!!objectName) {
                pictureName += ' fra ' + objectName;
            }

            this.pictures.forEach(function(model, index) {
                model.set('navn', pictureName);
            });
        },

        save: function () {

            this.setPictureNames();

            this.trigger('save:start');

            var afterPictureAndPoiSync = function () {

                this.model.save(undefined, {
                    success: $.proxy(function (e) {
                        this.trigger('save:end');
                    }, this),
                    error: $.proxy(function (e) {
                        Raven.captureException(e, {extra: {message: 'Error callback called when saving object to NTB.'}});
                        this.trigger('save:end');
                    }, this)
                });

            };

            this.saveRelated(afterPictureAndPoiSync);

        }

    });

});
