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
        Template = require('text!templates/links/manager.html'),
        LinksEditView = require('views/links/edit');

    // Module
    return Backbone.View.extend({

        el: '[data-view="links-manager"]',

        template: _.template(Template),

        events: {
            'click [data-action="add-link"]': 'addLink'
        },

        initialize: function (options) {

            // Set scope of methods to this view
            _.bindAll(this, 'addLink');

            this.linksField = options.linksField || 'lenker';
            this.links = this.model.get(this.linksField);
        },

        render: function () {
            var html = this.template();
            this.$el.html(html);

            _.each(this.links, this.renderLink, this);

            // Add link if empty. Do it after link looping, or else it will be rendered twice.
            if (this.links.length === 0) {
                this.addLink();
            }

            return this;
        },

        renderLink: function (link) {

            var linksEditView = new LinksEditView({
                model: this.model,
                link: link
            }).render();

            this.$('[data-container-for="all-links"]').append(linksEditView.el);
        },

        addLink: function (e) {
            var link = {
                tittel: '',
                url: 'http://'
            };

            // var links = this.model.get(this.linksField);

            this.links.push(link);
            this.model.set(this.linksField, this.links);

            this.renderLink(link);
        }



    });

});
