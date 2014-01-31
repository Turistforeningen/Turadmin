/*
 * Copyright (c) $year, Den Norske Turistforening (DNT)
 *
 * https://github.com/Turistforeningen/turadmin
 */

var DNT = window.DNT || {};

(function (ns) {
    "use strict";

    ns.PictureView = Backbone.View.extend({

        template: _.template($('#pictureTemplate').html()),

        initialize : function () {
        },

        events: {
            'click #positionPicture': 'positionPicture'
        },

        positionPicture: function () {
            if (!this.model.hasMarker()) {
                this.event_aggregator.trigger("map:positionPicture", this.model);
            }
            //scroll to map / show map
        },

        render: function () {
            var html =  this.template(this.model.toJSON());
            $(this.el).html(html);
            return this;
        }
    });
}(DNT));
