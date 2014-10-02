/**
 * Copyright (c) $year, Den Norske Turistforening (DNT)
 *
 * https://github.com/Turistforeningen/turadmin
 */

define(function (require, exports, module) {
    "use strict";

    // Dependencies
    var $ = require('jquery'),
        _ = require('underscore'),
        Backbone = require('backbone'),
        Template = require('text!templates/pois/edit.html'),
        User = require('models/user'),
        user = new User();

    require('select2');
    require('backbone-stickit');
    require('backbone-validation');


    // Module
    return Backbone.View.extend({

        template: _.template(Template),
        className: '',

        bindings: {
            '[name="navn"]': {
                observe: 'navn',
                setOptions: {
                    validate: true
                }
            },
            '[name="beskrivelse"]': {
                observe: 'beskrivelse',
                setOptions: {
                    validate: true
                }
            },
            '[name="kategori"]': {
                observe: 'kategori',
                setOptions: {
                    validate: true
                }
            },
            '[data-placeholder-for="poi-name"]': 'navn'
        },

        events: {
            'click [data-action="poi-delete"]': 'deletePoi',
            'click [data-action="poi-delete-modal-open"]': 'openDeleteModal'
        },

        initialize: function (options) {

            _.bindAll(this, 'deletePoi');

            this.model = options.model;
            this.pictureCollection = options.pictureCollection;
        },

        openDeleteModal: function (e) {
            this.$('.modal').modal('show');
        },

        deletePoi: function (e) {

            this.$('.modal').on('hidden.bs.modal', $.proxy(function (e) {
                this.model.remove();
                this.render();
            }, this));

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

            if (this.model.get('removed')) {
                this.remove();

            } else {
                var json = this.model.toJSON();
                json.cid = this.model.cid;
                var html =  this.template(json);
                $(this.el).html(html);

                this.stickit(); // Uses view.bindings and view.model to setup bindings
                Backbone.Validation.bind(this);
            }

            var poiTags = this.model.get('tags');
            var poiCategory = (poiTags.length > 0) ? poiTags[0] : '';
            var poiAdditionalCategories = (poiTags.length > 1) ? _.clone(poiTags) : [];

            poiAdditionalCategories.shift(); // Remove first item, as the first category is displayed in the field above "Er også"

            var alleStedKategorier = _.pluck(this.model.availableCategories, 'name');

            this.$('[data-container-for="flere-sted-kategorier-input"] input').select2({
                tags: alleStedKategorier,
                createSearchChoice: function () { return null; } // This will prevent the user from entering custom tags
            }).on('change', $.proxy(this.onFlereStedKategorierChange, this));

            this.$('[data-container-for="flere-sted-kategorier-input"] input').select2('val', poiAdditionalCategories);

            // this.poiPicturesView = new PoiPicturesView({ model: this.model, pictureCollection: this.pictureCollection });

            // this.$('.currentRouteImages .routePicturesContainer').append(this.poiPicturesView.render().el);

            return this;

        },

        remove: function() {
            // Remove the validation binding
            // See: http://thedersen.com/projects/backbone-validation/#using-form-model-validation/unbinding
            Backbone.Validation.unbind(this);
            return Backbone.View.prototype.remove.apply(this, arguments);
        }

    });

});
