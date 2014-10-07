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
        Template = require('text!templates/links/edit.html');

    // Module
    return Backbone.View.extend({

        tagName: 'div',

        attributes: {
            'data-view': 'links-edit',
            'class': 'row route-details-lenke'
        },

        template: _.template(Template),

        events: {
            // Key events
            'keyup input[name="lenke-tittel"]': 'reValidateTitle',
            'keyup input[name="lenke-url"]': 'reValidateUrl',

            // Input field changes
            'change input[name="lenke-tittel"]': 'setTitle',
            'change input[name="lenke-url"]': 'setUrl',

            // Click events
            'click [data-action="remove-link"]': 'removeLink'
        },

        validation: {
            // NOTE: Performing manual validation on the fields in this view, as the links does not have their own model.
        },

        initialize: function (options) {
            this.link = options.link;
        },

        render: function () {

            var html = this.template({link: this.link});
            this.$el.html(html);

            // this.validateTitle();
            // this.validateUrl();
            return this;
        },

        updateLink: function () {
            var links = this.model.get('lenker');
            var linkIndex = links.indexOf(this.link);
            links[linkIndex] = this.link;
            this.model.set('lenker', links);
        },

        setTitle: function (e) {
            var formField = e.currentTarget;
            var title = $(formField).val();
            this.link.tittel = title;
            this.validateTitle();
            this.updateLink();
        },

        validateTitle: function () {
            var $titleInput = this.$('[data-model-validation-field-name="tittel"]'),
                $formGroup = $titleInput.parent(),
                $errorMsg = $titleInput.next('.error-msg'),
                title = this.link.tittel,
                titleIsValid = !!title && title.length > 0;

            if (titleIsValid) {
                $formGroup.removeClass('has-error');
                $errorMsg.remove();
                this.titleIsInvalid = false;
            } else {
                this.titleIsInvalid = true;
                if ($errorMsg.length > 0) {
                    $errorMsg.html('Tittel er påkrevd');
                } else {
                    $formGroup.addClass('has-error');
                    $titleInput.after('<span class="help-block error-msg">Tittel er påkrevd</span>');
                }
            }
        },

        reValidateTitle: function (e) {
            if (this.titleIsInvalid === true) {
                var inputValue = e.target.value;
                this.link.tittel = inputValue;
                this.validateTitle();
            }
        },

        setUrl: function (e) {
            var formField = e.currentTarget;
            var url = $(formField).val();
            this.link.url = url;
            this.validateUrl();
            this.updateLink();
        },

        validateUrl: function () {
            var $urlInput = this.$('[data-model-validation-field-name="url"]'),
                $formGroup = $urlInput.parent(),
                $errorMsg = $urlInput.next('.error-msg'),
                url = this.link.url,
                linkIsValid = /^(https?|ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i.test(url);

            if (linkIsValid) {
                $formGroup.removeClass('has-error');
                $errorMsg.remove();
                this.urlIsInvalid = false;
            } else {
                this.urlIsInvalid = true;
                if ($errorMsg.length > 0) {
                    $errorMsg.html('Ugyldig nettadresse');
                } else {
                    $formGroup.addClass('has-error');
                    $urlInput.after('<span class="help-block error-msg">Ugyldig nettadresse</span>');
                }
            }
        },

        reValidateUrl: function (e) {
            if (this.urlIsInvalid === true) {
                var inputValue = e.target.value;
                this.link.url = inputValue;
                this.validateUrl();
            }
        },

        removeLink: function (e) {

            var links = this.model.get('lenker');
            var linkIndex = links.indexOf(this.link);
            links.splice(linkIndex, 1);
            this.model.set('lenker', links);
            this.remove();
        }


    });

});
