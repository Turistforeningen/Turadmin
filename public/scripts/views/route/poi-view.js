/*
 * Copyright (c) $year, Den Norske Turistforening (DNT)
 *
 * https://github.com/Turistforeningen/turadmin
 */

var DNT = window.DNT || {};

(function (ns) {
    "use strict";

    var alleStedKategorier = ['Hytte', 'Fjelltopp', 'Gapahuk', 'Rasteplass', 'Telplass', 'Geocaching', 'Turpostkasse', 'Turorientering', 'Utsiktspunkt', 'Attraksjon', 'Badeplass', 'Fiskeplass', 'Klatrefelt', 'Akebakke', 'Skitrekk', 'Kitested', 'Skøytevann', 'Toalett', 'Bro', 'Vadested', 'Parkering', 'Holdeplass', 'Togstasjon'];

    ns.PoiView = Backbone.View.extend({

        bindings: {
            '[name="navn"]': 'navn',
            '[name="beskrivelse"]': 'beskrivelse',
            '[name="kategori"]': 'kategori',
            '[data-placeholder="poi-name"]': 'navn'
        },

        events: {
            'click [data-action="poi-delete"]': 'deletePoi',
            'click [data-action="poi-delete-modal-open"]': 'openDeleteModal'
        },

        template: _.template($('#poiTemplate').html()),

        initialize: function (options) {
            this.event_aggregator.trigger('poi:doIt', {some: 'var'});
            // console.log('poiView:initialize');
            this.model = options.model;
            this.pictureCollection = options.pictureCollection;
            _.bindAll(this, 'deletePoi');
        },

        openDeleteModal: function (e) {
            this.$('.modal').modal('show');
        },

        deletePoi: function (e) {

            var me = this;

            this.$('.modal').on('hidden.bs.modal', function (e) {
                me.model.deletePoi();
                me.render();
            });

            this.$('.modal').modal('hide');

        },

        onFlereStedKategorierChange: function (e) {
            var currentTags = this.model.get('tags');
            var category = (currentTags.length > 0) ? currentTags[0] : null;
            var additionalCategories = e.val;
            var allCategories = (category === null) ? additionalCategories : [category].concat(additionalCategories);
            this.model.set('tags', allCategories);
        },

        render: function () {

            if (this.model.isDeleted()) {
                this.remove();
            } else {
                var json = this.model.toJSON();
                json.cid = this.model.cid;
                var html =  this.template(json);
                $(this.el).html(html);
                this.stickit(this.model, this.bindings);
            }

            var poiTags = this.model.get('tags');
            var poiCategory = (poiTags.length > 0) ? poiTags[0] : '';
            var poiAdditionalCategories = (poiTags.length > 1) ? _.clone(poiTags) : [];

            poiAdditionalCategories.shift(); // Remove first item, as the first category is displayed in the field above "Er også"

            this.$('.flereStedKategorierSelectContainer input').select2({
                tags: alleStedKategorier,
                createSearchChoice: function () { return null; } // This will prevent the user from entering custom tags
            }).on('change', $.proxy(this.onFlereStedKategorierChange, this));

            this.$('.flereStedKategorierSelectContainer input').select2('val', poiAdditionalCategories);

            var poiPicturesView = new DNT.PoiPicturesView({ model: this.model, pictureCollection: this.pictureCollection });
            this.$(".currentRouteImages .routePicturesContainer").append(poiPicturesView.render().el);

            return this;

        }
    });

}(DNT));
