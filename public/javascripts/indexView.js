/*
 * Copyright (c) $year, Den Norske Turistforening (DNT)
 *
 * https://github.com/Turistforeningen/turadmin
 */

var DNT = window.DNT || {};

(function (ns) {
    "use strict";

    ns.IndexView = Backbone.View.extend({

        el: "#listContainer",

        events: {
            'click #nyTurButton' : 'openNewRoutePage'
        },

        initialize : function () {
            _.bindAll(this, "render");
            $("#headerRouteName").addClass("hidden");
            this.collection = new DNT.RouteCollection();
            this.collection.on("reset", this.render);
            this.collection.fetch({reset: true});
        },

        openNewRoutePage : function () {
            // window.location = '/tur';
        },

        render: function () {
            var that = this;
            console.log(this.collection.length);
            this.collection.each(function (route) {
                var itemView = new ns.ListItemView({model: route});
                that.$el.find("#listItems").append(itemView.render().el);
            });
        }

    });

}(DNT));
