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
            id = options._id;

            switch(options.provider) {
                case 'DNT Connect':
                    // Special handling of DNT Connect users
                    break;
                case 'Mitt NRK':
                    // Special handling of Mitt NRK users
                    break;
                case 'Ekstern gruppebruker':
                    // Special handling of Ekstern gruppebruker users
                    break;
                default:
                    // No default
            }

            this.set('navn', options.fornavn + ' ' + options.etternavn);
            this.set('_id', id);
            this.set('id', id);
            // this.set('navn', navn);
        }

    });

}(DNT));
