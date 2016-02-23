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
            this.on('change:kontaktinfoPostnummer', this.setKontaktinfoObject, this);
            this.on('change:kontaktinfoPoststed', this.setKontaktinfoObject, this);
            this.setKontaktinfoFlattened();

            NtbModel.prototype.initialize.call(this, options);
        },

        setKontaktinfoObject: function () {
            var kontaktinfo = this.get('kontaktinfo') || [{}];
            var primaryKontaktinfo = _.findWhere(kontaktinfo, {type: 'Primærkontakt'}) || kontaktinfo[0] || {};

            var kontaktinfoEpost = this.get('kontaktinfoEpost');
            var kontaktinfoTelefon = this.get('kontaktinfoTelefon');
            var kontaktinfoFax = this.get('kontaktinfoFax');
            var kontaktinfoAdresse1 = this.get('kontaktinfoAdresse1');
            var kontaktinfoAdresse2 = this.get('kontaktinfoAdresse2');
            var kontaktinfoPostnummer = this.get('kontaktinfoPostnummer');
            var kontaktinfoPoststed = this.get('kontaktinfoPoststed');

            if (kontaktinfoEpost) {
                primaryKontaktinfo.epost = kontaktinfoEpost;
            } else {
                delete primaryKontaktinfo.epost;
            }

            if (kontaktinfoTelefon) {
                primaryKontaktinfo.telefon = kontaktinfoTelefon;
            } else {
                delete primaryKontaktinfo.telefon;
            }

            if (kontaktinfoFax) {
                primaryKontaktinfo.fax = kontaktinfoFax;
            } else {
                delete primaryKontaktinfo.fax;
            }

            if (kontaktinfoAdresse1) {
                primaryKontaktinfo.adresse1 = kontaktinfoAdresse1;
            } else {
                delete primaryKontaktinfo.adresse1;
            }

            if (kontaktinfoAdresse2) {
                primaryKontaktinfo.adresse2 = kontaktinfoAdresse2;
            } else {
                delete primaryKontaktinfo.adresse2;
            }

            if (kontaktinfoPostnummer) {
                primaryKontaktinfo.postnummer = kontaktinfoPostnummer;
            } else {
                delete primaryKontaktinfo.postnummer;
            }

            if (kontaktinfoPoststed) {
                primaryKontaktinfo.poststed = kontaktinfoPoststed;
            } else {
                delete primaryKontaktinfo.poststed;
            }

            primaryKontaktinfo.type = 'Primærkontakt';

            this.set({kontaktinfo: kontaktinfo}, {silent: true});
        },

        setKontaktinfoFlattened: function () {
            var kontaktinfo = this.get('kontaktinfo');
            var primaryKontaktinfo = _.findWhere(kontaktinfo, {type: 'Primærkontakt'}) || kontaktinfo[0] || {};

            this.set({
                kontaktinfoEpost: primaryKontaktinfo.epost,
                kontaktinfoTelefon: primaryKontaktinfo.telefon,
                kontaktinfoFax: primaryKontaktinfo.fax,
                kontaktinfoAdresse1: primaryKontaktinfo.adresse1,
                kontaktinfoAdresse2: primaryKontaktinfo.adresse2,
                kontaktinfoPostnummer: primaryKontaktinfo.postnummer,
                kontaktinfoPoststed: primaryKontaktinfo.poststed
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
            this.setKontaktinfoObject();

            // Call super with attrs moved to options
            return NtbModel.prototype.save.call(this, attrs, options);
        }

    });

});
