define(function (require, exports, module) {
    "use strict";

    // Dependencies
    var $ = require('jquery'),
        _ = require('underscore'),
        Backbone = require('backbone'),
        User = require('models/user'),
        user = new User();

    // Module
    return Backbone.Model.extend({

        initialize: function (options) {

            if (!!this.idAttribute && !!this.get(this.idAttribute)) {
                this.set('id', this.get(this.idAttribute));
            }

            this.listenTo(this, 'change:' + this.idAttribute, this.onIdChange);

            if (typeof options === 'object' && typeof options._id !== 'undefined') {

            } else {
                // New model, just being created

                // Set created by private property
                var privat = {
                    opprettet_av: {
                        id: user.get('id'),
                        navn: user.get('navn'),
                        epost: user.get('epost')
                    }
                };

                this.set('privat', privat);

                // Set groups property if user has single group property defined
                var userGroup = user.get('gruppe');
                var groupsData = this.get('grupper') || [];

                if (!!userGroup) {
                    groupsData.push(userGroup);
                    this.set('grupper', groupsData);
                }
            }

            this.set('synced', true);

            if (typeof this.serverAttrs === 'object') {
                for (var i = 0; i < this.serverAttrs.length; i++) {
                    this.listenTo(this, 'change:' + this.serverAttrs[i], this.onChange);
                }
            }

            this.listenTo(this, 'sync', function (model, resp, options) {
                this.set('synced', true);
            });

        },

        onIdChange: function (model, value, options) {
            this.set('id', this.get(this.idAttribute));
        },

        onChange: function (model, options) {

            var previousGeoJson = model.previous('geojson'),
                newGeoJson = model.get('geojson');

            // Prevent setting synced to false on map init, which is setting model
            // attribute geojson from undefined to empty geojson object
            if (previousGeoJson && newGeoJson) {
                this.set('synced', false);

            }

        },

        /* Setters and getters */

        setPublished: function(){
            this.set('status', 'Offentlig');
        },

        setUnpublished: function(){
            this.set('status', 'Kladd');
        },

        getLatLng: function () {
            var geojson = this.get('geojson');

            if (typeof geojson === 'object' && typeof geojson.coordinates === 'object' && geojson.coordinates.length === 2) {
                var lat = geojson.coordinates[1],
                    lng = geojson.coordinates[0];

                return [lat, lng];

            } else {
                return undefined;
            }
        },

        setLatLng: function (latLng) {
            var lat = latLng[0],
                lng = latLng[1],
                geojson = _.clone(this.get('geojson')); // Or else the change event won't fire! o_O

            if (typeof geojson === 'object' && geojson.type === 'Point') {
                geojson.coordinates = [lng, lat];
            } else {
                geojson = {type: 'Point', 'coordinates': [lng, lat], properties: {}};
            }

            this.set('geojson', geojson);

        },

        remove: function () {
            this.set('removed', true);
        },

        hasTag: function (tag) {
            var tags = this.get('tags');
            var hasTag = (typeof tags !== 'undefined') && (tags.indexOf(tag) > -1);
            return hasTag;
        },

        /* Process fields */

        // Recursive method that will remove all object properties
        // and array items that are empty strings.
        // TODO: Also remove empty link objects equal to {tittel: "", url: "http://"}
        removeEmpty: function (input) {

            var output = _.clone(input);

            if (Object.prototype.toString.call(output) === '[object Array]') {

                for (var i = 0; i < output.length; i++) {
                    if (typeof output[i] === 'object') {
                        // if ((output[i].tittel === '' && output[i].url === 'http://') || (typeof output[i].tittel === 'undefined' && output[i].url === 'http://')) { output.splice(i, 1); }
                        output[i] = this.removeEmpty(output[i]);
                    } else if (typeof output[i] === 'string') {
                        if (output[i] === '') {
                            output.splice(i, 1);
                        }
                    }
                }

            } else if (Object.prototype.toString.call(output) === '[object Object]') {

                for (var prop in output) {
                    if (typeof output[prop] === 'object') {
                        output[prop] = this.removeEmpty(output[prop]);
                    } else if (typeof output[prop] === 'string') {
                        if (output[prop] === '') {
                            delete output[prop];
                        }
                    }

                }

            }

            return output;

        },


        /* Server interactions */

        save: function (attrs, options) {

            var isValid = this.isValid(true); // Check if model is valid, to validate all fields. The result variable is not really needed, as we are saving the model to the server anyway
            var method;

            if (!!attrs._method) {
                method = attrs._method;
            }

            attrs = attrs || this.toJSON();
            options = options || {};

            // If model defines serverAttrs, replace attrs with trimmed version
            if (this.serverAttrs) {
                attrs = _.pick(attrs, this.serverAttrs);
            }

            attrs = this.removeEmpty(attrs);

            // Move attrs to options
            options.attrs = attrs;

            if (!!method) {
                options.attrs._method = method;
            }

            // Call super with attrs moved to options
            return Backbone.Model.prototype.save.call(this, attrs, options);
        }

    });

});
