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
            this.model.get("route").on("change", this.unsavedChanges, this);
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
            this.model.save(undefined, undefined, {
                success: function () {
                    console.log("success");
                },
                error: function (e) {
                    console.log("error", e);
                }
            });
        }
    });
}(DNT));