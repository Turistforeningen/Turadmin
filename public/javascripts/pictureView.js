/*
 * Copyright (c) $year, Den Norske Turistforening (DNT)
 *
 * https://github.com/Turistforeningen/turadmin
 */

var DNT = window.DNT || {};

(function (ns) {
    "use strict";

    var pictureViewBindings = {
        '[name="beskrivelse"]': "beskrivelse",
        '[name="foto-fotograf-navn"]': {
            observe: 'fotograf',
            onGet: 'getFotografNavnFromModel',
            onSet: 'formatFotografNavnToModel'
        },
        '[name="foto-fotograf-epost"]': {
            observe: 'fotograf',
            onGet: 'getFotografEpostFromModel',
            onSet: 'formatFotografEpostToModel'
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

        initialize: function (options) {

            // Listen to url changes (when saving, picture is moved from tmp to permanent storage)
            this.model.on("change:thumbnailUrl", this.render, this);
            this.app = options.app;

            this.setCurrentUserAsFotograf();

        },

        events: {
            'click #positionPicture': 'positionPicture',
            'click [data-toggle-current-user-is-fotograf]': 'toggleCurrentUserIsFotograf',
            'click #deletePicture': 'deletePicture',
            'pictureDropped': 'pictureIndexChanged'
        },

        toggleCurrentUserIsFotograf: function (e) {

            var currentUserIsFotograf = $(e.currentTarget).prop('checked') ? true : false;

            if (currentUserIsFotograf) {
                this.setCurrentUserAsFotograf();
                this.$('.form-group-fotograf').addClass('hidden');
            } else {
                this.model.set('fotograf', { navn: '', epost: '' });
                this.$('.form-group-fotograf').removeClass('hidden');
            }

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

        setCurrentUserAsFotograf: function () {
            var currentUser = this.app.get('user');
            this.model.set('fotograf', {
                navn: currentUser.get('navn'),
                epost: currentUser.get('epost')
            });
        },

        currentUserIsFotograf: function () {
            var currentUser = this.app.get('user').get('navn');
            var fotograf = this.getFotografNavnFromModel(this.model.get('fotograf'));
            return (currentUser === fotograf);
        },

        getFotografNavnFromModel: function (value) {
            return value.navn;
        },

        formatFotografNavnToModel: function (value) {
            return { navn: value };
        },

        getFotografEpostFromModel: function (value) {
            return value.epost;
        },

        formatFotografEpostToModel: function (value) {
            return { epost: value };
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

                if(this.currentUserIsFotograf()){
                    this.$('.form-group-fotograf').addClass('hidden');
                    this.$('[name="foto-jeg-har-tatt-bildet"]').prop('checked', true);
                }

            }

            return this;
        }
    });
}(DNT));
