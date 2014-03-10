/*
 * Copyright (c) $year, Den Norske Turistforening (DNT)
 *
 * https://github.com/Turistforeningen/turadmin
 */

var DNT = window.DNT || {};

(function (ns) {
    "use strict";

    var pictureViewBindings = {
        '[name = "beskrivelse"]' : "beskrivelse",
        '[name = "fotograf"]': {
            observe: 'fotograf',
            onGet: 'getFotografNavnFromModel',
            onSet: 'formatFotografNavnToModel'
        }
    };

    var allFotoTags = {
        selectData: [
            {
                value: "Gåtur",
                label: "Gåtur"
            },
            {
                value: "Skitur",
                label: "Skitur"
            }
        ]
    };

    ns.PictureView = Backbone.View.extend({

        template: _.template($('#pictureTemplate').html()),

        className: "picture-sortable col-sm-4 col-md-4 col-lg-3",

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
            this.event_aggregator.trigger("map:positionPicture", this.model);
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

        getFotografNavnFromModel: function (value) {
            return value.navn;
        },

        formatFotografNavnToModel: function (value) {
            return {navn: value};
        },

        render: function () {
            if (this.model.isDeleted()) {
                this.remove();
            } else {

                var html =  this.template(this.model.toJSON());
                $(this.el).html(html);
                this.stickit(this.model, pictureViewBindings);

                var fotoTagsSelectView = new DNT.SelectView({ model: this.model, selectOptions: allFotoTags });
                this.$('.foto-tags').append(fotoTagsSelectView.render().el);
                fotoTagsSelectView.$el.select2({ placeholder: "Tagger" });

//                 $(fotoTagsSelectView.el).select2({
//     placeholder: "Select a State"
// });
                // debugger;

            }
            return this;
        }
    });
}(DNT));
