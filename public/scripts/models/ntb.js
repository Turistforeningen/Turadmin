define(function (require, exports, module) {
    "use strict";

    // Dependencies
    var $ = require('jquery'),
        _ = require('underscore'),
        Backbone = require('backbone');

    // Module
    return Backbone.Model.extend({

        setPublished: function(){
            this.set('status', 'Offentlig');
        },

        setUnpublished: function(){
            this.set('status', 'Kladd');
        },

        save: function (attrs, options) {

            attrs = attrs || this.toJSON();
            options = options || {};

            // If model defines serverAttrs, replace attrs with trimmed version
            if (this.serverAttrs) {
                attrs = _.pick(attrs, this.serverAttrs);
            }

            // Move attrs to options
            options.attrs = attrs;

            // Call super with attrs moved to options
            return Backbone.Model.prototype.save.call(this, attrs, options);
        }

    });

});
