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

            this.searchCollection = new DNT.SearchCollection();
            this.searchFieldView = new DNT.SearchFieldView({ collection: this.searchCollection });
            this.gpxUploadView = new DNT.GpxUploadView({ model: this.model });
            this.mapView = new DNT.MapView({ model: this.model });
            this.pictureView = new DNT.PicturesView({ model: this.model });
            this.route = this.model.get("route");
            this.user = this.model.get('user');
            this.routeFactsView = new DNT.RouteFactsView({ model: this.route, user: this.user });
            this.route.on("change", this.unsavedChanges, this);
            this.poiCollection = this.model.get("poiCollection");
            this.poiCollection.on("add", this.unsavedChanges, this);
            this.pictureCollection = this.model.get("pictureCollection");
            this.poiCollectionView = new DNT.PoiCollectionView({ model: this.model, pictureCollection: this.pictureCollection });
            this.pictureCollection.on("add", this.unsavedChanges, this);

            this.updatePublishButtons();

        },

        events: {
            'click [data-action="route-save"]': 'save',
            'click [data-action="route-publish"]': 'publish',
            'click [data-action="route-unpublish"]': 'unpublish'
        },

        render: function () {
            this.searchFieldView.render();
            this.mapView.render();
            this.pictureView.render();
            this.poiCollectionView.render();
            this.routeFactsView.render();
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

            switch (allChangesSaved) {
                case true:
                    this.$('.navbar .route-save').removeClass('has-unsaved-changes');
                    this.$('.navbar .route-save').tooltip('hide');
                    this.$('.navbar .route-save').tooltip('disable');
                    break;

                case false:
                    this.$('.navbar .route-save').addClass('has-unsaved-changes');
                    this.$('.navbar .route-save').tooltip('enable');
                    break;
            }

        },

        unsavedChanges: function() {
            this.$(".disabled").removeClass("disabled"); // disable save button until model is changed
            this.updateSaveButton(false);
        },

        publish: function() {

            this.route.set('status', 'Offentlig', { silent: true });
            this.pictureCollection.setPublished();
            this.poiCollection.setPublished();
            this.save();

            // this.route.save(undefined, {
            // // NOTE: Should we use PATCH?
            // this.route.save({status: 'Offentlig'}, {
            //     silent: true,
            //     success: function() {
            //         me.updatePublishButtons();
            //     }
            // });

        },

        unpublish: function() {

            var me = this;
            this.route.set('status', 'Kladd', { silent: true });

            this.pictureCollection.setUnpublished();
            this.poiCollection.setUnpublished();

            this.save();

            // NOTE: Should we use PATCH?
            // this.route.save({status: 'Kladd'}, {
            //     silent: true,
            //     success: function() {
            //         me.updatePublishButtons();
            //     }
            // });

        },

        save: function() {

            var me = this;

            var afterPictureAndPoiSync = function () {
                me.route.setPoiIds(me.poiCollection.getPoiIds());
                me.route.setPictureIds(me.pictureCollection.getPictureIds());

                me.route.save(undefined, {
                    success: function () {
                        console.log("saved route");
                        me.updateSaveButton(true);
                        me.updatePublishButtons();
                    },
                    error: function (e) {
                        console.log("error", e);
                    }
                });

            };

            var saveDone = _.after(2, afterPictureAndPoiSync);

            this.poiCollection.save(
                function () {
                    saveDone();
                    console.log("All pois synced with server");
                },
                function (errorCount) {
                    saveDone();
                    console.error("Failed to sync " + errorCount + " pois");
                },
                this
            );

            this.pictureCollection.save(
                function () {
                    saveDone();
                    console.log("All pictures synced with server");
                },
                function (errorCount) {
                    saveDone();
                    console.error("Failed to sync " + errorCount + " pictures");
                },
                this
            );

        }

    });

}(DNT));
