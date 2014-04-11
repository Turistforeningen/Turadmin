/*
 * Copyright (c) $year, Den Norske Turistforening (DNT)
 *
 * https://github.com/Turistforeningen/turadmin
 */

var DNT = window.DNT || {};

(function (ns) {
    "use strict";

    var apiUri = function () {
        return "/restProxy/turer";
    };

    ns.Route = Backbone.Model.extend({

        idAttribute: "_id",

        defaults: {
            navn: '',
            geojson: null,
            lenker: [],
            tidsbrukDager: "1",
            tidsbrukTimer: "0",
            tidsbrukMinutter: "0",
            tidsbruk: { normal: {} },
            retning: "ABA",
            lisens: "CC BY-NC 3.0 NO",
            status: "Kladd",
            tags: [],
            privat: {
                opprettet_av: {
                    id: "someId"
                }
            }
        },

        serverAttrs: [
            '_id',
            'lisens',
            'navngiving',
            'status',
            'navn',
            'geojson',
            'distanse',
            'retning',
            // 'områder',
            // 'kommuner',
            // 'fylker',
            'beskrivelse',
            'adkomst',
            'kollektiv',
            'lenker',
            'gradering',
            'passer_for',
            'tilrettelagt_for',
            'sesong',
            'tidsbruk',
            'tags',
            'privat',
            'grupper',
            'bilder',
            'steder'
            // 'http'
        ],

        initialize: function () {
            this.on("change:linkText", this.updateLinks);

            this.on("change:turtype", this.updateTurtypeInTags);
            this.on("change:flereTurtyper", this.updateFlereTurtyperInTags);

            var duration = this.get('tidsbruk');

            if (!!duration.normal) {
                this.set('tidsbrukDager', (!!duration.normal.dager) ? duration.normal.dager : 0);
                this.set('tidsbrukTimer', (!!duration.normal.timer) ? duration.normal.timer : 0);
                this.set('tidsbrukMinutter', (!!duration.normal.minutter) ? duration.normal.minutter : 0);
            }

            this.set('turtype', this.getRouteType());
            this.set('flereTurtyper', this.getAdditionalRouteTypes());

        },

        urlRoot: function () {
            return apiUri();
        },

        isValid: function () {
            var geojson = this.get("geojson");
            return !_.isNull(geojson) && !_.isUndefined(geojson);
        },

        setPoiIds: function (ids) {
            this.set("steder", ids);
        },

        setPictureIds: function (ids) {
            this.set("bilder", ids);
        },

        updateTurtypeInTags: function () {
            var tags = this.get('tags');
            var turtype = this.get('turtype');
            tags[0] = turtype;
            this.set('tags', tags);
        },

        updateFlereTurtyperInTags: function () {
            var tags = this.get('tags');
            var turtype = tags[0];
            var flereTurtyper = this.get('flereTurtyper');
            tags = [turtype].concat(flereTurtyper);
            this.set('tags', tags);
        },

        getRouteType: function () {
            var tags = this.get('tags');
            return (tags.length) ? tags[0] : '';
        },

        getAdditionalRouteTypes: function () {
            var tags = this.get('tags');
            var additionalRouteTypes = _.rest(tags, 1);
            return additionalRouteTypes;
        },

        save: function (attrs, options) {

            this.updateLenker();
            this.updateTidsbruk();

            attrs = attrs || this.toJSON();
            options = options || {};

            // If model defines serverAttrs, replace attrs with trimmed version
            if (this.serverAttrs) {
                attrs = _.pick(attrs, this.serverAttrs);
            }

            // Move attrs to options
            options.attrs = attrs;

            // Call super with attrs moved to options
            return Backbone.Model.prototype.save.call(this, attrs, options);

        },

        updateLenker: function () {
            var linkText = this.get("linkText");
            var lenker = [];
            if (!!linkText) {
                var links = this.get("linkText").split("\n");
                if (_.isArray(links) && links.length > 0) {
                    var i;
                    for (i = 0; i < links.length; i = i + 1) {
                        var lenke = links[i];
                        if (lenke.length > 0) {
                            lenker.push({url: lenke});
                        }
                    }
                }
            }
            this.set("lenker", lenker);
        },

        updateTidsbruk: function () {
            var days = this.get("tidsbrukDager");
            var hours = this.get("tidsbrukTimer");
            var minutes = this.get("tidsbrukMinutter");
            var tidsbruk = {
                normal: {
                    timer: "0",
                    minutter: "0"
                }
            };
            tidsbruk.normal.dager = days;
            if (days && days === "1") {
                tidsbruk.normal.timer = hours;
                tidsbruk.normal.minutter = minutes;
            }
            this.set("tidsbruk", tidsbruk);
        }

    });

}(DNT));
