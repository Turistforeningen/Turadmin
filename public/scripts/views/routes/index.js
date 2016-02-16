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
        NtbIndexView = require('views/ntb/index'),
        RouteCollection = require('collections/routes');

    // Module
    return NtbIndexView.extend({
        collection: new RouteCollection(),

        render: function () {
            var $selectType = this.$('select[data-filter="type"]');
            if ($selectType.length && (this.collection.fetchQuery['rute'] || this.collection.fetchQuery['rute.type'])) {
                $selectType.val(this.collection.fetchQuery['rute'] || this.collection.fetchQuery['rute.type']);
            }

            NtbIndexView.prototype.render.call(this);
        }

    });

});
