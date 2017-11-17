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
        GroupModel = require('models/group'),
        Template = require('text!templates/groups/users.html'),
        state = require('state'),
        User = require('models/user'),
        user = new User();

    require('bootstrap');

    // Module
    return Backbone.View.extend({

        template: _.template(Template),

        el: '[data-view="group-users"]',

        bindings: {
            '[name="group-details-field-navn"]': {
                observe: 'navn',
                setOptions: {
                    validate: true
                }
            },
            '[name="group-user-field-navn"]': {
                observe: '_invite_name',
                setOptions: {
                    validate: true
                }
            },
            '[name="group-user-field-epost"]': {
                observe: '_invite_email',
                setOptions: {
                    validate: true
                }
            }
        },

        events: {
            'click [data-dnt-action="create-invite"]': 'createInvite',
            'click [data-dnt-action="send-invite"]': 'sendInvite',
            'click [data-dnt-action="save-group"]': 'saveGroup',
            'click [data-dnt-action="set-random-password"]': 'setRandomPassword',
            'click [data-dnt-action="remove-user"]': 'removeUser',
            'click [data-dnt-action="remove-invite"]': 'removeInvite',
            'click [data-dnt-action="discard-user-changes"]': 'resetEditingUser'
        },

        initialize: function (options) {
            this.model = options.group || new GroupModel();

            this.editor = options.editor;

            // Bind these methods to this scope
            _.bindAll(this, 'onStatusChange', 'createInvite', 'validateInvite', 'saveGroup', 'removeUser', 'render', 'toggleSendButton');

            this.model.on('change:_invite_disable_send', this.toggleSendButton);
            this.model.on('change:_invite_name', this.validateInvite);
            this.model.on('change:_invite_email', this.validateInvite);
            this.model.on('change:_invite_sent', this.onStatusChange);
            this.model.on('change:_invite_saved', this.onStatusChange);
            this.model.on('change:_invite_is_valid', this.onStatusChange);
            this.model.on('change:_id', this.render);

            this.user = user;
        },

        onStatusChange: function () {
            var isSaved = this.model.get('_invite_saved');
            var isValid = this.model.get('_invite_is_valid');

            if (isSaved) {
                this.model.set('_invite_disable_send', true);
            } else if (!isValid) {
                this.model.set('_invite_disable_send', true);
            } else {
                this.model.set('_invite_disable_send', false);
            }

            this.model.trigger('change:_invite_disable_send');
        },

        validateInvite: function () {
            var isValid = this.model.isValid(['_invite_name', '_invite_email']);
            this.model.set('_invite_is_valid', isValid);
        },

        toggleSendButton: function () {
            var $sendButton = this.$el.find('button[data-dnt-action="send-invite"]').first();
            var disable = this.model.get('_invite_disable_send') === true;

            $sendButton.attr('disabled', disable);
        },

        removeUser: function (e) {
            var userIndex = parseInt(e.target.getAttribute('data-dnt-index'), 10);
            var privat = this.model.get('privat');
            var user = privat.brukere[userIndex];

            if (window.confirm('Er du sikker på at du vil slette brukeren til ' + user.navn + ' (' + user.epost + ')?')) {
                $.ajax({
                    url: '/grupper/' + this.model.get('id') + '/brukere/' + user.id,
                    method: 'DELETE',
                    contentType: 'application/json',
                    dataType: 'json',
                    success: function (data, textStatus, jqXhr) {
                        // NOTE: Seems like set does not overwrite existing array, so first set it to empty array
                        this.model.set('privat.brukere', []);
                        this.model.set('privat.brukere', data.document.privat.brukere);
                    }.bind(this),
                    complete: function (jqXhr, textStatus) {
                        this.render();
                    }.bind(this)
                });
            }
        },

        createInvite: function () {
            this.invite = undefined;

            var length = 64;
            var charset = 'abcdefghijklnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
            var inviteCode = '';

            for (var i = 0, n = charset.length; i < length; ++i) {
                inviteCode += charset.charAt(Math.floor(Math.random() * n));
            }

            var inviteUrl = 'https://admin.nasjonalturbase.no/invitasjon?kode=' + inviteCode;

            this.model.set('_invite_create', true);
            this.model.set('_invite_saved', false);
            this.model.set('_invite_sent', false);
            this.model.set('_invite_name', '');
            this.model.set('_invite_email', '');
            this.model.set('_invite_code', inviteCode);
            this.model.set('_invite_url', inviteUrl);

            this.render();
        },

        sendInvite: function (e) {
            e.preventDefault();

            this.model.set('_invite_disable_send', true);

            var invite = {
                navn: this.model.get('_invite_name'),
                epost: this.model.get('_invite_email'),
                brukt: false,
                url: this.model.get('_invite_url'),
                kode: this.model.get('_invite_code'),
                invitert_av: {
                    id: this.user.get('id'),
                    navn: this.user.get('navn'),
                    epost: this.user.get('epost')
                }
            };

            $.ajax({
                url: '/grupper/' + this.model.get('id') + '/invitasjoner',
                method: 'POST',
                contentType: 'application/json',
                dataType: 'json',
                data: JSON.stringify({
                    navn: this.model.get('_invite_name'),
                    epost: this.model.get('_invite_email'),
                    gruppe: this.model.get('navn'),
                    url: this.model.get('_invite_url'),
                    kode: this.model.get('_invite_code'),
                    invitasjon: invite,
                }),
                complete: function (jqXhr, textStatus) {
                    var status = jqXhr.responseJSON;

                    this.invite = status;
                    this.invite.url = this.model.get('_invite_url');

                    if (status.saved) {
                        this.model.set('_invite_saved', true);
                        var invites = this.model.get('privat.invitasjoner') || [];
                        invites.push(invite);
                        this.model.set('privat.invitasjoner', invites);
                    }

                    this.model.set('_invite_sent', !!status.sent);
                    this.render();
                }.bind(this)
            });
        },



        removeInvite: function (e) {
            var code = e.target.getAttribute('data-dnt-code');
            var privat = this.model.get('privat');
            var invite = _.findWhere(privat.invitasjoner, {kode: code});

            if (window.confirm('Er du sikker på at du vil slette invitasjonen til ' + invite.epost + '?')) {
                $.ajax({
                    url: '/grupper/' + this.model.get('id') + '/invitasjoner/' + invite.kode,
                    method: 'DELETE',
                    contentType: 'application/json',
                    dataType: 'json',
                    success: function (data, textStatus, jqXhr) {
                        this.model.unset('privat');
                        this.model.set('privat', data.document.privat);
                    }.bind(this),
                    complete: function (jqXhr, textStatus) {
                        this.render();
                    }.bind(this)
                });
            }
        },

        saveGroup: function (e) {
            this.model.save();
        },

        render: function () {
            var json = this.model.toJSON();

            var unusedInvites = (json && json.privat && json.privat.invitasjoner && json.privat.invitasjoner.length) ? json.privat.invitasjoner.filter(function (invitasjon) {
                return !!invitasjon && invitasjon.brukt === false;
            }) : [];

            var html = this.template({
                model: json,
                invite: this.invite,
                unusedInvites: unusedInvites
            });

            this.$el.html(html);

            // Set up view bindings and validation

            this.stickit(); // Uses view.bindings and view.model to setup bindings
            Backbone.Validation.bind(this);

            return this;

        },

        remove: function() {
            // Remove the validation binding
            // See: http://thedersen.com/projects/backbone-validation/#using-form-model-validation/unbinding
            Backbone.Validation.unbind(this);
            return Backbone.View.prototype.remove.apply(this, arguments);
        }

    });
});
