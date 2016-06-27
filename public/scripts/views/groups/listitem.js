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
        Template = require('text!templates/groups/listitem.html'),
        User = require('models/user'),
        user = new User();

    require('bootstrap');

    // Module
    return NtbListItemView.extend({

        template: _.template(Template),

        isEditable: function () {
            return !(this.model.hasTag('DNT') && (
                this.model.hasTag('Sentral') ||
                this.model.hasTag('Medlemsforening') ||
                this.model.hasTag('Lokalforening') ||
                this.model.hasTag('Barnas Turlag') ||
                this.model.hasTag('Ungdomgruppe') ||
                this.model.hasTag('Fjellsport') ||
                this.model.hasTag('Senior') ||
                this.model.hasTag('Andre turgrupper')
            ));
        },

        render: function () {
            if (!this.model) {
                this.remove();
            } else {
                var data = this.makeJsonModel();
                data.userIsAdmin = user.get('er_admin');
                data.url = this.getItemEditUrl();
                var html = this.template(data);
                $(this.el).html(html);
                if (!this.isEditable()) {
                    this.$el.addClass('disabled');
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

            json.isEditable = this.isEditable();

            if (!!json.endret) {
                var date = new Date(Date.parse(json.endret));
                json.endret = date.toLocaleString();
            }
            return json;
        }
    });
});
