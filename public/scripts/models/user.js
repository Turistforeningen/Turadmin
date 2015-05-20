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
            options.grupper = state.userGroups || [];

            var additionalGroups = state.groupsData || [];

            // Check if user is member of all groups that the route is associated with
            // If not, add the missing groups to the user groups array
            // NOTE: The better (and more complicated) way to solve this would be to have two separate arrays,
            // but the current way be an acceptable solution, as the group will only be available in the
            // user groups array while the user is editing an object already associated with the group
            for (var i = 0; i < additionalGroups.length; i++) {
                var additionalGroup = additionalGroups[i];
                var additionalGroupId = additionalGroup._id;
                if (!_.findWhere(options.grupper, {object_id: additionalGroupId})) {

                    var group = {
                        object_id: additionalGroup._id,
                        navn: additionalGroup.navn
                    };

                    if (!!additionalGroup.privat && !!additionalGroup.privat.sherpa2_id) {
                        group.sherpa_id = additionalGroup.privat.sherpa2_id;
                    }

                    options.grupper.push(group);
                }
            }

            this.set('epost', options.epost);
            this.set('grupper', options.grupper);
            this.set('navn', options.navn);

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
                    if (!!options.gruppe && !!options.gruppe._id) {
                        this.set('gruppe', options.gruppe._id);
                    }
                    break;
                default:
                    // No default
            }

            this.set('provider', options.provider);

            if (!this.get('navn') && (!!options.fornavn && !!options.etternavn)) {
                this.set('navn', options.fornavn + ' ' + options.etternavn);
            }

            var grupper = this.get('grupper');
            var admin = !!_.findWhere(grupper, {navn: 'Den Norske Turistforening'});
            this.set('admin', admin); // NOTE: Deprecating this, use property "er_admin" instead.
            this.set('er_admin', admin);

            var isDntGroupMember = this.isDntGroupMember({grupper: grupper});
            this.set('er_dnt_gruppe_medlem', isDntGroupMember);

            this.set('_id', id);
            this.set('id', id);

            this.setDefaultGroup();

            Raven.setUserContext({
                name: this.get('navn'),
                id: this.get('id'),
                email: this.get('epost'),
                provider: this.get('provider'),
                is_admin: !!this.get('er_admin')
            });
        },

        isDntGroupMember: function (user) {
            var userGroups = user.grupper;
            return (!!userGroups && !!userGroups.length);
        },

        getDefaultGroup: function () {
            return this.defaultGroup;
        },

        setIsGroupUser: function () {
            var isGroupUser = (this.get('gruppe') === this.get('id'));
            this.set('er_gruppebruker', isGroupUser);
        },

        setDefaultGroup: function () {
            var provider = this.get('provider');

            switch (provider) {
                case 'DNT Connect':
                    var userGroups = this.get('grupper');

                    if (userGroups.length > 0) {
                        var sentralGroup = _.findWhere(userGroups, {type: 'sentral'});
                        var foreningGroup = _.findWhere(userGroups, {type: 'forening'});
                        var turlagGroup = _.findWhere(userGroups, {type: 'turlag'});
                        var turgruppeGroup = _.findWhere(userGroups, {type: 'turgruppe'});

                        var defaultGroup = sentralGroup || foreningGroup || turlagGroup || turgruppeGroup;

                        if (defaultGroup) {
                            this.set('gruppe', defaultGroup.object_id);

                        } else {
                            Raven.captureMessage('DNT Connect user did not belong to group of type "sentral", "forening", "turlag" or "turgruppe".', {extra: {user: this.toJSON()}});
                        }

                    } else {
                        Raven.captureMessage('DNT Connect user did not belong to any groups.', {extra: {user: this.toJSON()}});
                    }

                    break;

                case 'Innholdspartner':
                    // Does not require any additional handling. Yet.
                    break;

                default:
                    // No default
            }

        }

    });

});
