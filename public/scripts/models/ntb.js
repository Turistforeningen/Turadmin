define(function (require, exports, module) {
    "use strict";

    // Dependencies
    var $ = require('jquery'),
        _ = require('underscore'),
        Backbone = require('backbone');

    // Module
    return Backbone.Model.extend({


        /* Setters and getters */

        setPublished: function(){
            this.set('status', 'Offentlig');
        },

        setUnpublished: function(){
            this.set('status', 'Kladd');
        },


        /* Process fields */

        // Might not need this anymore

        // cleanTags: function () {
        //     var tags = this.get('tags');

        //     for (var i = 0; i < tags.length; i++) {
        //         if (tags[i] === '') {
        //             tags.splice(i, 1);
        //         }
        //     }

        //     this.set('tags', tags);
        // },

        // Recursive method that will remove all object properties
        // and array items that are empty strings.
        removeEmpty: function (input) {

            var output = _.clone(input);

            if (Object.prototype.toString.call(output) === '[object Array]') {

                for (var i = 0; i < output.length; i++) {
                    if (typeof output[i] === 'object') {
                        this.removeEmpty(output[i]);
                    } else if (typeof output[i] === 'string') {
                        if (output[i] === '') {
                            output.splice(i, 1);
                        }
                    }
                }

            } else if (Object.prototype.toString.call(output) === '[object Object]') {

                for (var prop in output) {
                    if (typeof output[prop] === 'object') {
                        this.removeEmpty(output[prop]);
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

            attrs = attrs || this.toJSON();
            options = options || {};

            // If model defines serverAttrs, replace attrs with trimmed version
            if (this.serverAttrs) {
                attrs = this.removeEmpty(_.pick(attrs, this.serverAttrs));
            }

            // Move attrs to options
            options.attrs = attrs;

            // Call super with attrs moved to options
            return Backbone.Model.prototype.save.call(this, attrs, options);
        }

    });

});
