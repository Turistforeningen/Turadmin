/*
 * Copyright (c) $year, Den Norske Turistforening (DNT)
 *
 * https://github.com/Turistforeningen/turadmin
 */

var DNT = window.DNT || {};

(function (ns) {
    "use strict";

    ns.PoiCollectionView = Backbone.View.extend({

        el: "#route-pois",

        events : {
            "click #newPoi": "addPoi"
        },

        initialize : function () {
            this.poiCollection = this.model.get("poiCollection");

            this.poiCollection.on("change:deleted", function () {
                //Render view when all pois are removed to show noPoisAlert div
                if (this.poiCollection.countPois() === 0) {
                    this.render();
                }
            }, this);
            _.bindAll(this, "poiMarkerIsCreated");
            this.event_aggregator.on("map:markerIsCreated", this.poiMarkerIsCreated);
        },

        addPoi: function () {
            this.event_aggregator.trigger("map:positionPicture", new DNT.Poi());
        },

        poiMarkerIsCreated: function (poi) {
            this.poiCollection.add(poi);
            var view = new DNT.PoiView({ model: poi});
            this.$("#route-pois-accordion").append(view.render().el);
            this.$("#noPoisAlert").addClass("hidden");
        },

        render: function () {
            if (this.poiCollection.countPois() === 0) {
                this.$("#noPoisAlert").removeClass("hidden");
            } else {
                this.$("#noPoisAlert").addClass("hidden");
            }
            //loop through poiCollection and append PoiViews.
            return this;
        }
    });
}(DNT));
