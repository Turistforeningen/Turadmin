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
        Poi = require('models/poi'),
        NtbCollection = require('collections/ntb');

    // Module
    return NtbCollection.extend({

        url: function () {
            return '/restProxy/steder';
        },

        removedModels: [],

        model: Poi,

        // initialize: function (pois) {
        //     NtbCollection.prototype.initialize.call(this, pois);
        // },

        deletePoi: function (model) {
            this.remove(model);
        },

        countPois: function () {
            var count  = this.filter(function (poi) {
                return !poi.isDeleted();
            });
            return count.length;
        },

        getPoiIds: function () {
            return this.pluck('_id');
        },

        // save: function (success, error, self) {
        //     var saveErrorCount = 0;

        //     var afterSave = function () {
        //         if (saveErrorCount > 0) {
        //             if (error) {
        //                 error.call(self, saveErrorCount);
        //             } else {
        //                 console.error("Error saving pois! " + saveErrorCount + " pois could not saved");
        //             }
        //         } else {
        //             if (success) {
        //                 success.call(self);
        //             }
        //         }
        //     };

        //     var unsyncedPois = this.filter(function (poi) {
        //         return poi.isNew() || poi.hasChanged() || poi.isDeleted();
        //     });

        //     var unsyncedPoisCount = unsyncedPois.length + this.removedModels.length;

        //     var saveDone = _.after(unsyncedPoisCount, afterSave);

        //     if (unsyncedPois.length === 0 && this.removedModels.length === 0) {
        //         afterSave();
        //     }

        //     // Delete removed POI's from server
        //     _.each(this.removedModels, $.proxy(function (poi) {
        //         poi.destroy({
        //             wait: true,
        //             success: $.proxy(function (model) {
        //                 // var modelIndex = this.removedModels.indexOf(model);
        //                 // if (modelIndex > -1) {
        //                 //     this.removedModels.splice(modelIndex, 1);
        //                 // }
        //                 // debugger;
        //                 saveDone();
        //             }, this, poi),
        //             error: function () {
        //                 saveErrorCount += 1;
        //                 saveDone();
        //             }
        //         });
        //     }, this));

        //     // Save unsynced POI's
        //     _.each(unsyncedPois, function (poi) {
        //         var isNew = poi.isNew();
        //         poi.save(undefined, {
        //             success : function () {
        //                 poi.resetHasChanged();
        //                 saveDone();
        //             },
        //             error: function () {
        //                 saveErrorCount += 1;
        //                 saveDone();
        //             }
        //         });
        //     });
        // }
    });
});
