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
        User = require('models/user');

    // Module
    return Backbone.Collection.extend({

        // NOTE: DO NOT define properties that should not be shared
        // between collections extending this collection, like removedModels

        state: {
            pageSize: 20,
            currentPage: 1,
            paginatorRequired: false
        },

        // Order models by date changed, descending
        comparator: function(model) {
            var date = new Date(model.get('endret'));
            return -date;
        },

        parse: function (resp, options) {
            var records = resp.documents || [];
            this.setState(resp);
            return records;
        },

        constructor: function() {
            // To be able to iterate on auto-added models.
            // See https://github.com/jashkenas/backbone/issues/814#issuecomment-4577128
            Backbone.Collection.prototype.constructor.apply(this, arguments);

            this.each($.proxy(function (element, index, list) {
                this.onAdd(element);
            }, this));
        },

        initialize: function (models) {
            this.on('add', this.onAdd, this);
            this.on('remove', this.onRemove, this);
            this.on('change:filter', this.onFilterChange);

            var user = new User();
            this.user = user;
        },

        // Getters and setters

        setState: function (resp) {
            this.state.totalRecords = resp.total;

            var nextPageSkip = this.state.pageSize * this.state.currentPage;
            this.state.nextPageSkip = (nextPageSkip >= this.state.totalRecords) ? false : nextPageSkip;

            var prevPageSkip = (this.state.pageSize * this.state.currentPage) - (this.state.pageSize * 2);
            this.state.prevPageSkip = (prevPageSkip < 0) ? false : prevPageSkip;

            this.state.totalPages = Math.ceil((this.state.totalRecords / this.state.pageSize));

            this.state.paginatorRequired = (this.state.totalRecords > this.state.pageSize) ? true : false;
        },

        setPublished: function () {
            this.each(function (model, index) {
                model.setPublished();
            });
        },

        setUnpublished: function () {
            this.each(function (model, index) {
                model.setUnpublished();
            });
        },


        // Event triggered methods

        onAdd: function (model) {
            model.on('change:removed', function (model) {
                if (model.get('removed') === true) {
                    this.remove(model);
                }
            }, this);
        },

        onRemove: function (model) {
            // Add to removedModels if saved to server, to send a DELETE request when collection is saved
            // IF option destroyRemoved === true is passed to collection save method

            // Conditions: If the delete request has not been sent to server already (changed.synced)
            // And model has been saved to server (has an ID)
            // And the collection has removedModels property
            if (!(!!model.changed && !!model.changed.synced) && !!model.get('_id') && (typeof this.removedModels === 'object')) {
                this.removedModels.push(model);
            }
        },

        onFilterChange: function (e) {
            this.fetchQuery = this.fetchQuery || {};
            this.fetchQuery['sort'] = '-endret';

            this.fetch({
                reset: true,
                data: this.fetchQuery
            });
        },


        // Filtering

        hasFiltersApplied: function () {

            if (!!this.fetchQuery) {

                // TODO: Need to be different for POI's, as they have `rute` as query param by default.
                if (this.fetchQuery['navn'] || this.fetchQuery['områder'] || this.fetchQuery['rute']) {
                    return true;
                }

                var queryGruppeId = this.fetchQuery['gruppe'];
                var queryBrukerId = this.fetchQuery['privat.opprettet_av.id'];

                if (this.user.get('er_admin')) {

                    if (queryGruppeId || queryBrukerId) {
                        return true;
                    }

                } else if (this.user.get('er_gruppebruker')) {

                    if (queryBrukerId) {
                        return true;

                    } else if (queryGruppeId && (queryGruppeId !== this.user.get('id'))) {
                        return true;
                    }

                } else {

                    if (queryGruppeId) {
                        return true;

                    } else if (queryBrukerId && (queryBrukerId !== this.user.get('id'))) {
                        return true;
                    }

                }

            }

            return false;
        },

        clearFilters: function () {

            delete this.fetchQuery['navn'];
            delete this.fetchQuery['områder'];
            delete this.fetchQuery['rute'];
            delete this.fetchQuery['gruppe'];
            delete this.fetchQuery['privat.opprettet_av.id'];

            if (this.user.get('er_admin')) {
                // Do nothing, no filters required. Just trigger filter change event!

            } else {
                this.setFilterEier(this.user.get('id'));
            }

            this.trigger('change:filter');
        },

        setFilterNavn: function (term) {
            this.fetchQuery = this.fetchQuery || {};

            if (term === '') {
                delete this.fetchQuery['navn'];

            } else {
                this.fetchQuery['navn'] = '~' + term;
            }

            this.trigger('change:filter');
        },

        setFilterOmrader: function (omradeId) {
            this.fetchQuery = this.fetchQuery || {};

            if (!omradeId) {
                delete this.fetchQuery['områder'];

            } else {
                this.fetchQuery['områder'] = omradeId;
            }

            this.trigger('change:filter');
        },

        setFilterEier: function (id) {
            this.fetchQuery = this.fetchQuery || {};

            if ((id == this.user.get('id')) && (!this.user.get('er_gruppebruker'))) {
                this.fetchQuery['privat.opprettet_av.id'] = id;
                delete this.fetchQuery['gruppe'];

            } else if (id === 'alle') {
                delete this.fetchQuery['gruppe'];
                delete this.fetchQuery['privat.opprettet_av.id'];

            } else {
                this.fetchQuery['gruppe'] = id;
                delete this.fetchQuery['privat.opprettet_av.id'];

            }

            this.trigger('change:filter');
        },


        // Server interactions

        save: function (success, error, self, options) {

            options = options || {};
            var relatedCollection = options.relatedCollection;

            var saveErrorCount = 0;

            var afterSave = function () {
                if (saveErrorCount > 0) {
                    if (error) {
                        Raven.captureMessage('Error when saving model to NTB. Handled in error callback function.');
                        error.call(self, saveErrorCount, relatedCollection);
                    } else {
                        Raven.captureMessage('Error when saving model to NTB. Not handled in code.');
                    }
                } else {
                    if (success) {
                        success.call(self, relatedCollection);
                    }
                }
            };

            var allModelsCount = this.length + this.removedModels.length;

            if (allModelsCount === 0) {
                success.call(self, relatedCollection);

            } else {
                var saveDone = _.after(allModelsCount, afterSave);

                if (this.removedModels.length) {

                    if (options.destroyRemoved === true) {

                        _.each(this.removedModels, function (model, index, list) {

                            model.destroy({
                                wait: true,
                                success: $.proxy(function (model) {
                                    var removedModelIndex = this.removedModels.indexOf(model);
                                    if (removedModelIndex !== -1) {
                                        this.removedModels.splice(removedModelIndex, 1);
                                    }
                                    saveDone();
                                }, this),
                                error: function () {
                                    saveErrorCount += 1;
                                    saveDone();
                                }
                            });
                        }, this);

                    } else {

                        for (var i = 0; i < this.removedModels.length; i++) {
                            saveDone();
                        }

                    }

                }

                _.each(this.models, function (model) {
                    // console.log('Saving model', model.get('_id'));

                    model.save(undefined, {
                        wait: true,
                        success: function (model, response, options) {
                            saveDone();
                        },
                        error: function (model, response, options) {
                            saveErrorCount += 1;
                            saveDone();
                        }
                    });
                });
            }
        }


    });

});
