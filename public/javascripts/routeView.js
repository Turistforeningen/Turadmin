/*
 * Copyright (c) $year, Den Norske Turistforening (DNT)
 *
 * https://github.com/Turistforeningen/turadmin
 */

var DNT = window.DNT || {};

(function (ns) {
    "use strict";

    ns.RouteView = Backbone.View.extend({

        el: "#commonRouteNav",

        initialize : function () {
            this.mapView = new DNT.MapView({model: this.model});
            this.pictureView = new DNT.PicturesView({model: this.model});
            this.route = this.model.get("route");
            this.route.on("change", this.unsavedChanges, this);
            this.poiCollection = this.model.get("poiCollection");
            this.poiCollection.on("add", this.unsavedChanges, this);
            this.pictureCollection = this.model.get("pictureCollection");
            this.pictureCollection.on("add", this.unsavedChanges, this);
        },

        events: {
            'click #save': 'save'
        },

        render: function () {
            this.mapView.render();
        },

        unsavedChanges : function () {
            this.$(".disabled").removeClass("disabled");
        },

        save : function () {

            var that = this;

            var afterPictureAndPoiSync = function () {
                if (that.route.isValid()) {
                    that.route.save(undefined, {
                        success: function () {
                            console.log("saved route");
                        },
                        error: function (e) {
                            console.log("error", e);
                        }
                    });
                }
            };

            var saveDone = _.after(2, afterPictureAndPoiSync);

            this.poiCollection.save(
                function (newIds) {
                    this.route.addPois(newIds);
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
                function (newIds) {
                    this.route.addPictures(newIds);
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