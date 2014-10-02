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

            if (typeof options === 'object' && typeof options._id !== 'undefined') {

            } else {

                var privat = {
                    opprettet_av: {
                        id: user.get('id'),
                        navn: user.get('navn'),
                        epost: user.get('epost')
                    }
                };

                this.set('privat', privat);
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


        /* Process fields */

        // Recursive method that will remove all object properties
        // and array items that are empty strings.
        removeEmpty: function (input) {

            var output = _.clone(input);

            if (Object.prototype.toString.call(output) === '[object Array]') {

                for (var i = 0; i < output.length; i++) {
                    if (typeof output[i] === 'object') {
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


        /* Hooks */

        beforeSave: function () {

            this.saveRelated();

            return true;
        },


        /* Server interactions */

        saveRelated: function () {

            // debugger;
        },

        save: function (attrs, options) {

            if (typeof this.beforeSave === 'function' && this.beforeSave() !== true) {
                return false;
            }

            attrs = attrs || this.toJSON();
            options = options || {};

            // If model defines serverAttrs, replace attrs with trimmed version
            if (this.serverAttrs) {
                attrs = this.removeEmpty(_.pick(attrs, this.serverAttrs));
            }

            attrs = this.removeEmpty(attrs);

            // Move attrs to options
            options.attrs = attrs;

            // Call super with attrs moved to options
            return Backbone.Model.prototype.save.call(this, attrs, options);
        }

    });

});
