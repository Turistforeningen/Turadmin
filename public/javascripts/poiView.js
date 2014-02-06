/*
 * Copyright (c) $year, Den Norske Turistforening (DNT)
 *
 * https://github.com/Turistforeningen/turadmin
 */

var DNT = window.DNT || {};

(function (ns) {
    "use strict";

    ns.PoiView = Backbone.View.extend({

        template: _.template($('#poiTemplate').html()),

        initialize : function () {
        },

        events: {
            'click #deletePoi': 'deletePoi'
        },

        deletePicture: function (e) {
            e.preventDefault();
            this.model.deletePoi();
            this.render();
        },

        render: function () {
            if (this.model.isDeleted()) {
                this.remove();
            } else {
                var html =  this.template(this.model.toJSON());
                $(this.el).html(html);
            }
            return this;
        }
    });
}(DNT));
