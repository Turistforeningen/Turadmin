/*
 * Copyright (c) $year, Den Norske Turistforening (DNT)
 *
 * https://github.com/Turistforeningen/turadmin
 */

define(function (require, exports, module) {
    "use strict";

    // Dependencies
    var $ = require('jquery'),
        Backbone = require('backbone'),
        Template = require('text!templates/pois/manager.html'),
        PoiModel = require('models/poi'),
        PoiCollection = require('collections/pois'),
        PoiEditView = require('views/pois/edit'),
        User = require('models/user'),
        user = new User();

    // Module
    return Backbone.View.extend({

        el: '[data-view="pois-manager"]',
        template: _.template(Template),
        defaults: {},

        events: {
            'click [data-action="do-create-poi"]': 'addPoi'
        },

        initialize: function (options) {

            // Be sure to bind scope of methods associated with events above to this view
            _.bindAll(this, 'addPoi');

            // If no POI collection is passed, create a new one
            this.pois = options.pois || new PoiCollection();

            // If no picture collection are passed, there is no use in creating a new one
            this.pictures = options.pictures;

            // The route this POI manager is in context of
            this.route = options.route;

            // Map... Add some logic to set up a new map if one is not passed as an option
            this.map = options.map;

            // Set defaults for new models if passed
            this.defaults = options.defaults || this.defaults;

            // Event listeners

            this.pois.on('add', this.appendPoi, this);

            this.pois.on('change:deleted', function () {
                // Render view when all pois are removed to show noPoisAlert div
                if (this.pois.countPois() === 0) {
                    this.render();
                }
            }, this);

            this.event_aggregator.on('map:markerIsCreated', this.poiMarkerIsCreated);
        },

        render: function () {

            var html = this.template(this.pois.toJSON());
            this.$el.html(html);

            if (this.pois.countPois() === 0) {
                this.$("#noPoisAlert").removeClass("hidden");
            } else {
                this.$("#noPoisAlert").addClass("hidden");
            }
            // Loop through pois and append PoiViews.
            this.pois.each(this.appendPoi, this);

            return this;
        },

        addPoi: function () {
            var poi = new PoiModel();
            this.map.positionModel(poi, $.proxy(this.onMarkerCreate, this));
        },

        onMarkerCreate: function (poi, latLng) {
            poi.set('geojson', {type: 'Point', coordinates: latLng.reverse()});
            this.pois.add(poi);
        },

        appendPoi: function (poi) {
            var view = new PoiEditView({model: poi, pictures: this.pictures});
            this.$('[data-container-for="all-pois-container"]').append(view.render().el);
            this.$('[data-container-for="no-pois-message"]').addClass('hidden');
        }

    });
});
