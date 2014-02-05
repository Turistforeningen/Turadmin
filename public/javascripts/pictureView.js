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

        className: "picture-sortable col-sm-4",

        initialize : function () {
            //Listen to url changes (when saving, picture is moved from tmp to permanent storage)
            this.model.on("change:thumbnailUrl", this.render, this);
        },

        events: {
            'click #positionPicture': 'positionPicture',
            'click #deletePicture': 'deletePicture',
            'pictureDropped': 'pictureIndexChanged'
        },

        positionPicture: function (e) {
            e.preventDefault();
            // Moving conditional to mapView.js
            // if (!this.model.hasMarker()) {
            this.event_aggregator.trigger("map:positionPicture", this.model);
            // }
            //scroll to map / show map
        },

        deletePicture: function (e) {
            e.preventDefault();
            this.model.deletePicture();
            this.render();
        },

        pictureIndexChanged: function (event, index) {
            //Trig event to tell picturesView.js instance which model has a new index
            this.$el.trigger('updatePictureIndexes', [this.model, index]);
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
