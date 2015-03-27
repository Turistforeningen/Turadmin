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
        Template = require('text!templates/ssr/simple.html');

    require('jquery-ssr');
    require('select2');

    return Backbone.View.extend({

        template: _.template(Template),

        el: '[data-view="ssr-simple"]',

        initialize: function (options) {
            try {
                this.callback = options.callback;
            } catch (e) {
                Raven.captureMessage('Could not initialize ssr-simple view. Missing option callback.');
            }
        },

        render: function () {
            var html = this.template();
            $(this.el).html(html);

            this.$el.find('input').select2({
              placeholder: 'Finn sted',
              minimumInputLength: 2,
              formatResult: function(obj) {
                return '<label>' + obj.stedsnavn + '</label><br>' + '<small>' + obj.navnetype + ' in ' + obj.kommunenavn + ' in ' + obj.fylkesnavn + '</small>';
              },
              query: function(options) {
                var res = [];

                $.fn.SSR(options.term).done(function (data) {
                  res = data.stedsnavn;
                }).always(function () {
                  for (var i = 0; i < res.length; i++) {
                    res[i].id = res[i].ssrId;
                    res[i].text = res[i].stedsnavn;
                  }
                  options.callback({results: res, more: false});
                });
              }

            }).on('change', $.proxy(this.callback, this)).on('select2-highlight', function(e) {

            });

            return this;
        }

    });
});
