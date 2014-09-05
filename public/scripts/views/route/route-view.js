/*
 * Copyright (c) $year, Den Norske Turistforening (DNT)
 *
 * https://github.com/Turistforeningen/turadmin
 */

var DNT = window.DNT || {};

(function(ns) {
    "use strict";

    ns.RouteView = Backbone.View.extend({

        el: '#view-route',

        initialize: function (options) {

            this.searchCollection = new ns.SearchCollection();
            this.searchFieldView = new ns.SearchFieldView({collection: this.searchCollection});
            this.gpxUploadView = new ns.GpxUploadView({model: this.model });
            this.routeDrawView = new ns.RouteDrawView({ model: this.model });
            this.pictureView = new ns.PicturesView({ model: this.model });
            this.route = this.model.get('route');
            this.user = this.model.get('user');
            this.routeFactsView = new ns.RouteFactsView({model: this.route, user: this.user});
            this.route.on('change', this.unsavedChanges, this);
            this.poiCollection = this.model.get('poiCollection');
            this.poiCollection.on('add', this.unsavedChanges, this);
            this.pictureCollection = this.model.get('pictureCollection');
            this.poiCollectionView = new ns.PoiCollectionView({model: this.model, pictureCollection: this.pictureCollection});
            this.pictureCollection.on('add', this.unsavedChanges, this);
            this.event_aggregator.on('map:routeReset', this.routeDrawReset, this);

            this.updatePublishButtons();

        },

        events: {
            'click [data-action="route-save"]': 'save',
            'click [data-action="route-publish"]': 'publish',
            'click [data-action="route-unpublish"]': 'unpublish'
        },

        render: function () {
            this.searchFieldView.render();
            this.routeDrawView.render();
            this.pictureView.render();
            this.poiCollectionView.render();
            this.routeFactsView.render();

            var modelHasRoute = this.model.get('route').hasRoute();
            if (modelHasRoute === true) {
                this.routeDrawView.hideFindPlaceAndGpxUpload();
            }

        },

        updatePublishButtons: function () {

            var routeStatus = this.route.get('status');

            switch (routeStatus) {
                case 'Kladd':
                    this.$('[data-action="route-publish"]').removeClass('hidden');
                    this.$('[data-action="route-unpublish"]').addClass('hidden');
                    break;

                case 'Offentlig':
                    this.$('[data-action="route-publish"]').addClass('hidden');
                    this.$('[data-action="route-unpublish"]').removeClass('hidden');
                    break;
            }
        },

        updateSaveButton: function (allChangesSaved) {

            var $saveButton = this.$('.navbar .route-save');

            switch (allChangesSaved) {
                case true:
                    $saveButton.removeClass('has-unsaved-changes');
                    $saveButton.tooltip({title: ''});
                    $saveButton.tooltip('hide');
                    $saveButton.tooltip('disable');
                    $saveButton.removeClass('disabled').html('<span class="glyphicon glyphicon-floppy-disk"></span> Lagre');
                    break;

                case false:
                    $saveButton.addClass('has-unsaved-changes');
                    $saveButton.tooltip({title: 'Du har gjort endringer som ikke er lagret'});
                    $saveButton.tooltip('enable');
                    break;
            }

        },

        unsavedChanges: function(e) {
            var routeModel = this.model.get('route'),
                previousGeoJson = routeModel.previous('geojson'),
                newGeoJson = routeModel.get('geojson');

            // Prevent savebutton from indicating unsaved changes, on map init (which is setting model attribute geojson from undefined to empty route)
            if (previousGeoJson && newGeoJson) {
                this.updateSaveButton(false);
            }
        },

        publish: function() {
            this.route.set('status', 'Offentlig', { silent: true });
            this.pictureCollection.setPublished();
            this.poiCollection.setPublished();
            this.save();
        },

        unpublish: function() {
            this.route.set('status', 'Kladd', { silent: true });
            this.pictureCollection.setUnpublished();
            this.poiCollection.setUnpublished();
            this.save();
        },

        save: function() {

            var me = this;
            var $saveButton = this.$('.navbar .route-save');

            $saveButton.addClass('disabled').html('<span class="glyphicon glyphicon-floppy-disk"></span> Lagrer...');

            var afterPictureAndPoiSync = function () {

                me.route.setPoiIds(me.poiCollection.getPoiIds());
                me.route.setPictureIds(me.pictureCollection.getPictureIds());

                me.route.save(undefined, {
                    success: function () {
                        me.updateSaveButton(true);
                        me.updatePublishButtons();
                    },
                    error: function (e) {
                        console.log('error', e);
                    }
                });

            };

            var saveDone = _.after(2, afterPictureAndPoiSync);

            this.poiCollection.save(
                function () {
                    saveDone();
                    console.log('All pois synced with server');
                },
                function (errorCount) {
                    saveDone();
                    console.error('Failed to sync ' + errorCount + ' pois');
                },
                this
            );

            this.pictureCollection.save(
                function () {
                    saveDone();
                    console.log('All pictures synced with server');
                },
                function (errorCount) {
                    saveDone();
                    console.error('Failed to sync ' + errorCount + ' pictures');
                },
                this
            );

        }

    });

}(DNT));
