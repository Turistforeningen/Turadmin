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
            this.route = this.model.get("route");
            this.route.on("change", this.unsavedChanges, this);
            this.poiCollection = this.model.get("poiCollection");
            this.poiCollection.on("add", this.unsavedChanges, this);
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
            this.poiCollection.save(
                function () {
                    console.log("All pois synced with server");
                },
                function (errorCount) {
                    console.error("Failed to sync " + errorCount + " pois");
                },
                this
            );

            this.route.save(undefined, {
                success: function () {
                    console.log("saved route");
                },
                error: function (e) {
                    console.log("error", e);
                }
            });
        }
    });
}(DNT));