/*
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
        PoiModel = require('models/poi'),
        Template = require('text!templates/lists/pois.html'),
        PoiPositioningView = require('views/pois/positioning'),
        state = require('state');

    require('backbone-stickit');
    require('bootstrap');
    require('select2');
    require('select2-locale_no');

    // Module
    return Backbone.View.extend({

        template: _.template(Template),

        el: '[data-view="list-pois"]',

        events: {
            'click [data-dnt-action="poi-add"]': 'addPoi',
            'click [data-dnt-action="poi-remove-modal-open"]': 'openModalRemovePoi',
            'click [data-dnt-action="poi-remove"]': 'removePoi'
        },

        bindings: {
            '[data-dnt-container="kommuner"]': {
                observe: 'kommuner',
                onGet: function (value) {
                    return value.join(', ');
                }
            },
            '[data-dnt-container="fylker"]': {
                observe: 'fylker',
                onGet: function (value) {
                    return value.join(', ');
                }
            }
        },

        initialize: function (options) {
            this.pois = options.pois;
            this.model = options.list;
            this.editor = options.editor;

            // Bind these methods to this scope
            _.bindAll(this, 'addPoi', 'removePoi', 'render');
        },

        initPoiSearch: function () {
            $('input[name="poi-search"]').select2({
                language: 'nb',
                ajax: {
                    url: '/restProxy/steder',
                    dataType: 'json',
                    delay: 500,
                    data: function (term) {
                        return {
                            'navn': '~' + term
                        };
                    },
                    cache: true,
                    results: function (data, params) {
                        return {
                            results: data.documents.reduce(function (prevVal, currVal, currIndex, array) {
                                prevVal.push({id: currVal._id, text: currVal.navn});
                                return prevVal;
                            }, [])
                        };
                    }
                },
                minimumInputLength: 3
            }).on('select2-selecting', $.proxy(function (e) {
                this.addPoi(e.object);
            }, this));
        },

        addPoi: function (poi) {
            var poiModel = new PoiModel({
                _id: poi.id,
                navn: poi.text
            });
            this.pois.add(poiModel);
            this.render();
            poiModel.fetch({
                success: $.proxy(function () {
                    this.updateKommuner();

                }, this)
            });
        },

        updateKommuner: function () {
            var kommuner = _.without(_.uniq(this.pois.pluck('kommune')), undefined);
            this.model.set('kommuner', kommuner);
        },

        updateFylker: function () {
            var fylker = _.without(_.uniq(this.pois.pluck('fylke')), undefined);
            this.model.set('fylker', fylker);
        },

        removePoi: function (e) {
            var poiId = $(e.currentTarget).attr('data-dnt-id');
            this.$('.modal').on('hidden.bs.modal', $.proxy(function (e) {
                this.pois.remove(poiId);
                this.render();
            }, this));

            this.$('.modal').modal('hide');
        },

        openModalRemovePoi: function (e) {
            var id = $(e.currentTarget).parents('[data-dnt-id]').attr('data-dnt-id');
            this.$('[data-dnt-id="' + id + '"] .modal').modal('show');
        },

        render: function () {
            var html = this.template({
                pois: this.pois.toJSON()
            });

            this.$el.html(html);

            this.poiPositioningView = new PoiPositioningView({
                model: this.model,
                el: '[data-view="list-positioning"]',
                updateSsrId: false,
                updateNavn: false
            }).render();

            // Set kommuner and fylker
            this.updateKommuner();
            this.updateFylker();

            this.initPoiSearch();

            // Bind model to view
            this.stickit(); // Uses view.bindings and view.model to setup bindings

            return this;
        },

        remove: function () {
            // Remove the validation binding
            // See: http://thedersen.com/projects/backbone-validation/#using-form-model-validation/unbinding
            Backbone.Validation.unbind(this);
            return Backbone.View.prototype.remove.apply(this, arguments);
        }

    });
});
