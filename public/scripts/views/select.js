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
        Template = require('text!templates/select.html');

    return Backbone.View.extend({

        tagName: 'select',
        className: 'form-control',
        template: _.template(Template),

        events: {
            'change': 'onSelect'
        },

        initialize: function (options) {
            this.selectOptions = options.selectOptions;
            this.selectValue = options.selectValue;
        },

        onSelect: function () {},

        setValue: function (value) {

            value = value || this.selectValue;

            if (!!value) {
                this.$el.prop('value', this.selectValue);
            }

        },

        render: function () {
            var html = this.template({selectOptions: this.selectOptions});
            $(this.el).html(html);

            this.setValue();

            return this;
        }
    });
});
