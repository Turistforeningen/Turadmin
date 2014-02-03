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
            //Listen to url changes (when saving, picture is moved from tmp to permanent storage)
            this.model.on("change:thumbnailUrl", this.render, this);
        },

        events: {
            'click #positionPicture': 'positionPicture',
            'click #deletePicture': 'deletePicture'
        },

        positionPicture: function (e) {
            e.preventDefault();
            if (!this.model.hasMarker()) {
                this.event_aggregator.trigger("map:positionPicture", this.model);
            }
            //scroll to map / show map
        },

        deletePicture: function (e) {
            e.preventDefault();
            this.model.deletePicture();
            this.render();
        },

        render: function () {
            if (this.model.isDeleted()) {
                this.remove();
            } else {
                var html =  this.template(this.model.toJSON());
                $(this.el).html(html);
                return this;
            }
        }
    });
}(DNT));
