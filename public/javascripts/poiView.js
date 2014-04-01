/*
 * Copyright (c) $year, Den Norske Turistforening (DNT)
 *
 * https://github.com/Turistforeningen/turadmin
 */

var DNT = window.DNT || {};

(function (ns) {
    "use strict";

    var alleStedKategorier = {
        selectData: [
            { value: "Hytte", label: "Hytte" },
            { value: "Fjelltopp", label: "Fjelltopp" },
            { value: "Gapahuk", label: "Gapahuk" },
            { value: "Rasteplass", label: "Rasteplass" },
            { value: "Telplass", label: "Telplass" },
            { value: "Geocaching", label: "Geocaching" },
            { value: "Turpostkasse", label: "Turpostkasse" },
            { value: "Turorientering", label: "Turorientering" },
            { value: "Utsiktspunkt", label: "Utsiktspunkt" },
            { value: "Attraksjon", label: "Attraksjon" },
            { value: "Badeplass", label: "Badeplass" },
            { value: "Fiskeplass", label: "Fiskeplass" },
            { value: "Klatrefelt", label: "Klatrefelt" },
            { value: "Akebakke", label: "Akebakke" },
            { value: "Skitrekk", label: "Skitrekk" },
            { value: "Kitested", label: "Kitested" },
            { value: "Skøytevann", label: "Skøytevann" },
            { value: "Toalett", label: "Toalett" },
            { value: "Bro", label: "Bro" },
            { value: "Vadested", label: "Vadested" },
            { value: "Parkering", label: "Parkering" },
            { value: "Holdeplass", label: "Holdeplass" },
            { value: "Togstasjon", label: "Togstasjon" }
        ]
    };

    var poiViewBindings = {
        '[name="navn"]': "navn",
        '[name="beskrivelse"]': "beskrivelse",
        '[name="kategori"]': "kategori",
        '#poiHeader': "navn"
    };

    ns.PoiView = Backbone.View.extend({

        template: _.template($('#poiTemplate').html()),

        initialize: function () {
        },

        events: {
            'click #deletePoi': 'deletePoi'
        },

        deletePicture: function (e) {
            e.preventDefault();
            this.model.deletePoi();
            this.render();
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
                this.stickit(this.model, poiViewBindings);
            }

            var flereStedKategorierSelect = new DNT.SelectView({ model: this.model, selectOptions: alleStedKategorier });
            this.$('.flereStedKategorierSelectContainer').html(flereStedKategorierSelect.render().el);

            var poiTags = this.model.get('tags');
            var poiCategory = (poiTags.length > 0) ? poiTags[0] : '';
            var poiAdditionalCategories = (poiTags.length > 1) ? _.clone(poiTags) : [];

            poiAdditionalCategories.shift(); // Remove first item, as the first category is displayed in the field above "Er også"
            flereStedKategorierSelect.$el.select2().select2('val', poiAdditionalCategories).on('change', $.proxy(this.onFlereStedKategorierChange, this));

            return this;

        }
    });
}(DNT));
