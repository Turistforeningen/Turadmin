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
        NtbModel = require('models/ntb');

    // Module
    return NtbModel.extend({

        type: 'group',
        idAttribute: '_id',
        forcedLicense: 'CC BY-SA 4.0',

        urlRoot: '/ntb-api/grupper',

        defaults: {
            // navn: '', // Not set as default, because of validation
            // beskrivelse: '', // Not set as default, because of validation
            lenker: [],
            lisens: 'CC BY-SA 4.0',
            status: 'Offentlig',
            tags: [],
            privat: {}
        },

        forced: {
            status: 'Offentlig'
        },

        serverAttrs: [
            // '_id', 'tilbyder', 'endret', 'checksum' // Legges automatisk inn av Nasjonal Turbase
            'lisens',
            'navngiving',
            'status',
            'navn',
            'geojson',
            'områder',
            'kommuner',
            'fylker',
            'organisasjonsnummer',
            'beskrivelse',
            'logo',
            'ansatte',
            'lenker',
            'kontaktinfo',
            'tags',
            'foreldregruppe',
            'privat',
            'grupper',
            'bilder',
            'steder',
            'url'
        ],

        validation: {
            navn: {
                required: true,
                msg: 'Dette feltet er påkrevd.'
            },
            beskrivelse:  {
                required: true,
                msg: 'Dette feltet er påkrevd.'
            },
            kontaktinfoEpost: {
                required: false,
                msg: 'Dette feltet må fylles ut med en epostadresse.'
            }
        },

        initialize: function (options) {
            if (!!this.idAttribute && !!this.get(this.idAttribute)) {
                this.set('id', this.get(this.idAttribute));
            }

            this.on('change:kontaktinfoEpost', this.setKontaktinfoObject, this);
            this.on('change:kontaktinfoAdresse1', this.setKontaktinfoObject, this);
            this.on('change:kontaktinfoAdresse2', this.setKontaktinfoObject, this);
            this.on('change:kontaktinfoTelefon', this.setKontaktinfoObject, this);
            this.on('change:kontaktinfoFax', this.setKontaktinfoObject, this);
            this.setKontaktinfoFlattened();

            NtbModel.prototype.initialize.call(this, options);
        },

        setKontaktinfoObject: function () {
            var kontaktinfo = this.get('kontaktinfo') || [{}];
            var kontaktinfoEpost = this.get('kontaktinfoEpost');
            var kontaktinfoTelefon = this.get('kontaktinfoTelefon');
            var kontaktinfoFax = this.get('kontaktinfoFax');
            var kontaktinfoAdresse1 = this.get('kontaktinfoAdresse1');
            var kontaktinfoAdresse2 = this.get('kontaktinfoAdresse2');

            if (kontaktinfoEpost) {
                kontaktinfo[0].epost = kontaktinfoEpost;
            } else {
                delete kontaktinfo[0].epost;
            }

            if (kontaktinfoTelefon) {
                kontaktinfo[0].telefon = kontaktinfoTelefon;
            } else {
                delete kontaktinfo[0].telefon;
            }

            if (kontaktinfoFax) {
                kontaktinfo[0].fax = kontaktinfoFax;
            } else {
                delete kontaktinfo[0].fax;
            }

            if (kontaktinfoAdresse1) {
                kontaktinfo[0].adresse1 = kontaktinfoAdresse1;
            } else {
                delete kontaktinfo[0].adresse1;
            }

            if (kontaktinfoAdresse2) {
                kontaktinfo[0].adresse2 = kontaktinfoAdresse2;
            } else {
                delete kontaktinfo[0].adresse2;
            }

            this.set({kontaktinfo: kontaktinfo}, {silent: true});
        },

        setKontaktinfoFlattened: function () {
            var kontaktinfo = this.get('kontaktinfo') || [{}];
            this.set({
                kontaktinfoEpost: kontaktinfo[0].epost,
                kontaktinfoTelefon: kontaktinfo[0].telefon,
                kontaktinfoFax: kontaktinfo[0].fax,
                kontaktinfoAdresse1: kontaktinfo[0].adresse1,
                kontaktinfoAdresse2: kontaktinfo[0].adresse2
            }, {silent: true});
        },

        updateUrl: function () {
            var groupId = this.get('id');
            var publishedState = this.get('status');

            if (groupId && publishedState === 'Offentlig') {
                this.set('url', 'http://www.ut.no/gruppe/' + groupId);

            } else {
                this.unset('url');
            }
        },

        save: function (attrs, options) {

            this.updateUrl();

            // Call super with attrs moved to options
            return NtbModel.prototype.save.call(this, attrs, options);
        }

    });

});
