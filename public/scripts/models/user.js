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
        state = require('state');

    // Module
    return Backbone.Model.extend({

        idAttribute: '_id',
        type: 'user',
        defaults: {},

        initialize: function (options) {

            // TODO: Major

            options = state.userData;
            options.grupper = state.userGroups;

            this.set('epost', options.epost);
            this.set('grupper', options.grupper);

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
                case 'Innholdspartner':
                    // Special handling of Innholdspartner users
                    break;
                default:
                    // No default
            }

            if (!this.get('navn') && (!!options.fornavn && !!options.etternavn)) {
                this.set('navn', options.fornavn + ' ' + options.etternavn);
            }

            var grupper = this.get('grupper');
            var admin = !!_.findWhere(grupper, {navn: 'Den Norske Turistforening'});

            this.set('admin', admin);
            this.set('_id', id);
            this.set('id', id);
        }

    });

});
