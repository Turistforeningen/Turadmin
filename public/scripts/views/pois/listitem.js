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
        NtbListItemView = require('views/ntb/listitem'),
        Template = require('text!templates/pois/listitem.html'),
        User = require('models/user'),
        user = new User();

    require('bootstrap');

    // Module
    return NtbListItemView.extend({

        template: _.template(Template),

        render: function () {
            if (!this.model) {
                this.remove();
            } else {
                var data = this.makeJsonModel();
                data.userIsAdmin = user.get('admin');
                var html = this.template(data);
                $(this.el).html(html);
                if (this.model.hasTag('Hytte')) {
                    this.$el.addClass('disabled').removeClass('clickable');
                }
            }
            return this;
        },

        makeJsonModel : function () {
            var json = this.model.toJSON();

            var publisert = 'Nei';
            if (this.model.get('status') === 'Offentlig') {
                publisert = 'Ja';
            }
            json.erPublisert = publisert;

            json.hasTagHytte = this.model.hasTag('Hytte');

            if (!!json.endret) {
                var date = new Date(Date.parse(json.endret));
                json.endret = date.toLocaleString();
            }
            return json;
        }
    });
});
