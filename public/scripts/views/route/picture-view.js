/*
 * Copyright (c) $year, Den Norske Turistforening (DNT)
 *
 * https://github.com/Turistforeningen/turadmin
 */

var DNT = window.DNT || {};

(function (ns) {
    'use strict';

    var allFotoTags = ['action', 'ake', 'akrobatikk', 'aksjon', 'aktiv', 'anorakk', 'appelsin', 'august', 'balanse', 'barn', 'blid', 'bre', 'breklatring', 'brevandring', 'briller', 'brodder', 'bærtur', 'bål', 'bålmat', 'båt', 'camp', 'cover', 'dagstur', 'dame', 'damer', 'dessert', 'detaljbilde', 'dnt', 'dnt-hytte', 'dnt ung', 'dråper', 'dugnad', 'dyr', 'elv', 'energi', 'eng', 'familie', 'fellestur', 'festival', 'fiske', 'fjell', 'fjellflørting', 'fjellski', 'fjelltopp', 'fjelltur', 'fjord', 'fjortis', 'flagg', 'flørting', 'fottur', 'fred', 'friluftsliv', 'gapahuk', 'gassbrenner', 'glad', 'glede', 'gps', 'grave', 'grottetur', 'gruppebilde', 'gutt', 'gutter', 'gård', 'hav', 'heia', 'helgetur', 'himmel', 'historie', 'historikk', 'hjelm', 'hopp', 'hund', 'husdyr', 'hverdagstur', 'hygge', 'hytte', 'hyttebok', 'hytteguide', 'hyttekos', 'hytter', 'hyttesamler', 'hytte til hytte', 'hyttetur', 'hyttevert', 'høst', 'høstaktiviteter', 'høstferie', 'høstfjellet', 'høsttur', 'innsjø', 'instruktør', 'interiør', 'is', 'isbre', 'isklatring', 'isøks', 'jente', 'jenter', 'jubel', 'jul', 'kaffe', 'kajakk', 'kajakkpadling', 'kajakktur', 'kake', 'kaldt', 'karabin', 'kart', 'kiting', 'kjærester', 'kjærlighet', 'klart', 'klatre', 'klatrekurs', 'klatresko', 'klatretau', 'klatring', 'klem', 'klipper', 'klær', 'kompass', 'kopp', 'kos', 'kurs', 'kveld', 'kvinne', 'kvinner', 'kvist', 'kvisteløype', 'kyss', 'kyst', 'landskap', 'langrenn', 'langrute', 'langtur', 'latter', 'le', 'leder', 'leir', 'leirliv', 'lek', 'leke', 'logo', 'lommelykttur', 'lykt', 'lys', 'løp', 'løpe', 'løype', 'maling', 'mann', 'mat', 'matlaging', 'menn ', 'menneske', 'merke', 'merking', 'middag', 'mobiltelefon', 'mor', 'morgen', 'mose', 'musikk', 'måltid', 'månelyst', 'natt', 'natur', 'naturen', 'nordlys', 'norge', 'norsk', 'nyttår', 'nærhet', 'nærmiljø', 'nærtur', 'opptur', 'orientering', 'padle', 'padling', 'par', 'partnere', 'pause', 'pinnebrød', 'planlegging', 'portrett', 'publikum', 'pulk', 'påkledning', 'regn', 'reise', 'robåt', 'rullestol', 'ryggsekk', 'rødekors', 'sekk', 'selvbetjent', 'sender/mottaker', 'senior', 'sikkerhet', 'sikkerhetsutstyr', 'siluett', 'singel', 'ski', 'skihopp', 'skilek', 'skilt', 'skilting', 'skiløype', 'skisko', 'skitur', 'skiutstyr', 'skog', 'skogtur', 'skole', 'skolehytter', 'skoletur', 'skred', 'skredfare', 'skredsøker', 'skredutstyr', 'smarttelefon', 'smil', 'sne', 'snekring', 'snø', 'snøhuletur', 'snøskred', 'sol', 'solbriller', 'solnedgang', 'soloppgang', 'sommer', 'sopptur', 'sosialt', 'sovepose', 'sovesal', 'spade', 'spill', 'spor', 'staver', 'stearinlys', 'steinhytte', 'stemning', 'sti', 'stier', 'stillenatur', 'stillhet', 'stjerner', 'sykkel', 'sykkeltur', 'symboler', 'sæter', 'søkestang', 'telefon', 'telt', 'tenåring', 'terreng', 'tid', 'tilrettelegging', 'tinder', 'tinderangling', 'tog', 'toget', 'topp', 'topptur', 'trilletur', 'trygg', 'tur', 'turbo', 'turdag', 'turfølge', 'turglad', 'turglede', 'turinfo', 'turistforeningshytte', 'turisthytte', 'turlag', 'turleder', 'turledere', 'turmat', 'turpartnere', 'turplanlegging', 'turskilt', 'turutstyr', 'tyttebær', 'tåke', 'ubetjent', 'ung', 'ungdom', 'ut', 'ute', 'uteaktiviteter', 'utsikt', 'utstyr', 'vandring', 'vann', 'varde', 'varding', 'vei', 'veivalg', 'venner', 'vennetur', 'vertskap', 'vidde', 'villmark', 'vind', 'vindsekk', 'vinter', 'vinteraktivitet', 'vinteraktiviteter', 'vinterbekledning', 'vinterferie', 'vinterfjellet', 'vintermerking', 'vinterruter', 'vintertur', 'vintervett', 'vær', 'vår', 'vårskitur', 'x-ung', 'yatzy', 'årstid'];

    ns.PictureView = Backbone.View.extend({

        template: _.template($('#pictureTemplate').html()),
        className: 'picture-sortable col-sm-4 col-md-4 col-lg-3',

        bindings: {
            '[name="beskrivelse"]': 'beskrivelse',
            '[name="foto-fotograf-navn"]': 'fotografNavn',
            '[name="foto-fotograf-epost"]': 'fotografEpost'
        },

        initialize: function (options) {
            // Listen to url changes (when saving, picture is moved from tmp to permanent storage)
            this.model.on('change:thumbnailUrl', this.render, this);
            this.app = options.app;

        },

        events: {
            'click #positionPicture': 'positionPicture',
            'click [data-toggle-current-user-is-fotograf]': 'toggleCurrentUserIsFotograf',
            'click #deletePicture': 'deletePicture',
            'pictureDropped': 'pictureIndexChanged'
        },

        toggleCurrentUserIsFotograf: function (e) {

            var currentUserIsFotograf = $(e.currentTarget).prop('checked') ? true : false;

            if (currentUserIsFotograf) {
                this.setCurrentUserAsFotograf();
                this.$('.form-group-fotograf').addClass('hidden');
            } else {
                this.model.set('fotografNavn', '');
                this.model.set('fotografEpost', '');
                this.$('.form-group-fotograf').removeClass('hidden');
            }

        },

        positionPicture: function (e) {
            e.preventDefault();
            this.event_aggregator.trigger('map:positionPicture', this.model);
        },

        deletePicture: function (e) {
            e.preventDefault();
            this.model.deletePicture();
            this.render();
        },

        pictureIndexChanged: function (event, index) {
            //Trig event to tell picturesView.js instance which model has a new index
            this.$el.trigger('updatePictureIndexes', [this.model, index]);
        },

        setCurrentUserAsFotograf: function () {
            var currentUser = this.app.get('user');
            this.model.set('fotografNavn', currentUser.get('navn'));
            this.model.set('fotografEpost', currentUser.get('epost'));
        },

        currentUserIsFotograf: function () {
            var currentUser = this.app.get('user').get('navn');
            var fotograf = this.model.get('fotografNavn');
            return (currentUser === fotograf);
        },

        onPhotoTagsChange: function (e) {
            var tags = e.val;
            this.model.set('tags', tags);
        },

        render: function () {
            if (this.model.isDeleted()) {
                this.remove();
            } else {

                var html =  this.template(this.model.toJSON());
                $(this.el).html(html);

                this.stickit(this.model, this.bindings);

                this.$('input[name="foto-tags"]')
                    .select2({placeholder: 'Tagger', tags: allFotoTags, tokenSeparators: [',', ' ']})
                    .select2('val', this.model.get('tags'))
                    .on('change', $.proxy(this.onPhotoTagsChange, this));

                if (this.currentUserIsFotograf()) {
                    this.$('.form-group-fotograf').addClass('hidden');
                    this.$('[name="foto-jeg-har-tatt-bildet"]').prop('checked', true);
                }

            }

            return this;
        }
    });
}(DNT));
