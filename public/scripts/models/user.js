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
            options.eksterne_grupper = state.userExternalGroups || [];

            var additionalGroups = state.groupsData || [];

            // Check if user is member of all groups that the route is associated with
            // groupsData is an array of groups the object being edited belongs to
            // If not, add the missing groups to the user groups array
            // NOTE: The better (and more complicated) way to solve this would be to have two separate arrays,
            // but the current way be an acceptable solution, as the group will only be available in the
            // user groups array while the user is editing an object already associated with the group
            for (var i = 0; i < additionalGroups.length; i++) {
                var additionalGroup = additionalGroups[i];
                var additionalGroupId = additionalGroup._id;
                if (!_.findWhere(options.grupper, {object_id: additionalGroupId}) || !_.findWhere(options.eksterne_grupper, {_id: additionalGroupId})) {

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
            this.set('eksterne_grupper', options.eksterne_grupper);
            this.set('er_admin', options.er_admin);

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

            var isDntGroupMember = this.isDntGroupMember({grupper: grupper});
            this.set('er_dnt_gruppe_medlem', isDntGroupMember);

            var isExternalGroupMember = this.isExternalGroupMember(this);
            this.set('er_ekstern_gruppe_medlem', isExternalGroupMember);

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

        isExternalGroupMember: function (user) {
            var externalGroups = user.get('eksterne_grupper');
            return externalGroups && !!externalGroups.length;
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
            var defaultGroup;

            switch (provider) {
                case 'DNT Connect':
                    var userGroups = this.get('grupper');
                    var externalUserGroups = this.get('eksterne_grupper');

                    if (userGroups.length > 0) {
                        var sentralGroup = _.findWhere(userGroups, {type: 'sentral'});
                        var foreningGroup = _.findWhere(userGroups, {type: 'forening'});
                        var turlagGroup = _.findWhere(userGroups, {type: 'turlag'});
                        var turgruppeGroup = _.findWhere(userGroups, {type: 'turgruppe'});

                        defaultGroup = sentralGroup || foreningGroup || turlagGroup || turgruppeGroup;

                        if (defaultGroup) {
                            this.set('gruppe', defaultGroup.object_id);

                        } else {
                            Raven.captureMessage('DNT Connect user did not belong to group of type "sentral", "forening", "turlag" or "turgruppe".', {extra: {user: this.toJSON()}});
                        }

                    } else if (externalUserGroups.length > 0) {
                        defaultGroup = externalUserGroups[0];

                        this.set('gruppe', defaultGroup._id);
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
