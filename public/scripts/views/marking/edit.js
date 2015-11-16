/**
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
        moment = require('moment'),
        Template = require('text!templates/marking/edit.html'),
        MarkingModel = require('models/marking'),
        User = require('models/user'),
        user = new User();

    require('datepicker-lang-no');
    require('moment');
    require('select2');
    require('backbone-stickit');
    require('backbone-validation');


    // Module
    return Backbone.View.extend({

        template: _.template(Template),
        className: '',

        availableMarkings: [
            'T-merket',
            'Umerket',
            'Lokalt merket',
            'Brerute',
            'Båtrute',
            'Kvisting'
        ],

        bindings: {
            '[name="route-comment"]': 'merknader',
            '[data-dnt-placeholder="rute-kode"]': {
                observe: 'kode'
            },
            '[name="route-marking-id"]': {
                observe: 'kode',
                setOptions: {
                    validate: true
                }
            },
            '[name="beskrivelse"]': {
                observe: 'beskrivelse',
                setOptions: {
                    validate: true
                }
            },
            '[name="kategori"]': {
                observe: 'kategori',
                setOptions: {
                    validate: true
                }
            },
            '.route-marking-type input': {
                observe: 'merkinger'
            },
            '[data-placeholder-for="poi-name"]': 'navn',
            '[name="route-marking-from-date"]': 'kvistingFra',
            '[name="route-marking-to-date"]': 'kvistingTil',
            '[name="route-marking-comment"]': 'kvistingKommentar',
            '[name="route-marking-allyear"]': 'kvistingHelars'
        },

        initialize: function (options) {
            this.model = options.model;
            this.model.on('change:kvistingHelars', this.render, this);
            this.model.on('change:merkinger', this.render, this);
        },

        render: function () {

            // Render template
            var jsonModel = this.model.toJSON();
            var html =  this.template({
                model: jsonModel,
                availableMarkings: this.availableMarkings,
                user: user.toJSON()
            });
            $(this.el).html(html);

            // Fix datepickers
            $('.route-marking-period input[name="route-marking-from-date"]').datepicker({
                forceParse: false, // AFAICS forceparse fails and causes existing date to be cleared when picker is dismissed
                format: 'dd.mm.yyyy',
                weekStart: 1,
                language: 'no'
            });

            $('.route-marking-period input[name="route-marking-to-date"]').datepicker({
                forceParse: false, // AFAICS forceparse fails and causes existing date to be cleared when picker is dismissed
                format: 'dd.mm.yyyy',
                weekStart: 1,
                startDate: moment().format('DD.MM.YYYY'),
                language: 'no'
            });

            // Set up data bindings
            this.stickit(); // Uses view.bindings and view.model to setup bindings
            Backbone.Validation.bind(this);

            return this;
        }

    });

});
