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

        el: $('[data-view="links-manager"]'),

        // events: {
        //     // 'sortstop #route-pictures-all-container': 'picturePositionUpdated',
        //     // 'updatePictureIndexes': 'updateIndexes'
        // },

        // initialize: function (options) {

        //     // Set scope of methods to this view
        //     // _.bindAll(this, 'picturePositionUpdated', 'updateIndexes');
        // }

        template: _.template(Template),

        events: {
            'click [data-action="add-link"]': 'addLink'
        },

        initialize: function (options) {
            this.linksField = options.linksField || 'lenker';
            // var linksArray = this.model.get('lenker');
            // this.model.set('lenker', linksArray);
        },

        render: function () {
            var html = this.template();
            $(this.el).html(html);
            var links = this.model.get('lenker');

            _.each(links, this.renderLink, this);
            return this;
        },

        renderLink: function (link, linkNumber, list) {

            var linksEditView = new LinksEditView({
                model: this.model,
                link: link,
                linkNumber: linkNumber
            }).render();

            this.$('[data-container-for="all-links"]').append(linksEditView.el);
        },

        addLink: function (e) {
            var link = {
                tittel: '',
                url: 'http://'
            };

            var links = this.model.get(this.linksField);

            links.push(link);
            this.model.set(this.linksField, links);

            this.renderLink(link);
        }



    });

});
