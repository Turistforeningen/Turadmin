/*
 * Copyright (c) $year, Den Norske Turistforening (DNT)
 *
 * https://github.com/Turistforeningen/turadmin
 */

var DNT = window.DNT || {};

(function (ns) {
    "use strict";

    ns.User = Backbone.Model.extend({

        idAttribute: '_id',
        type: 'user',
        defaults: {},

        initialize: function (options) {
            options = options || {};

            var userType, id, navn; // Possible userType values: 'sherpa', 'mittnrk', 'gruppebruker'

            if (!!options.sherpa_id) {
                userType = 'sherpa';
                id = options.sherpa_id;
                navn = options.fornavn + ' ' + options.etternavn;
            }

            // else if (someWayToIdentifyMittNrkUser) {
            // } else if (someWayToIdentifyGruppebruker) {
            // } else {}

            this.set('_id', id);
            this.set('navn', navn);
        }

    });

}(DNT));
