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
        },

        addPoi: function () {
            var poi = new DNT.Poi();
            this.event_aggregator.trigger("map:positionPicture", poi);
            this.poiCollection.add(poi);
            //var view = new DNT.PictureView({ model: poi});
            //this.$("#route-pois-accordion").append(view.render().el);
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
