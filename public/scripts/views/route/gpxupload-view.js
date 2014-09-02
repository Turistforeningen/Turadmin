/*
 * Copyright (c) $year, Den Norske Turistforening (DNT)
 *
 * https://github.com/Turistforeningen/turadmin
 */

var DNT = window.DNT || {};

(function (ns) {
    "use strict";

    ns.GpxUploadView = Backbone.View.extend({

        el: '#gpxUploadView',
        uploadUrl: '/upload/gpx',

        $uploadButton: null,
        $uploadButtonLabel: null,
        $uploadSpinner: null,
        $uploadStatus: null,

        initialize: function (options) {
            this.setupFileUpload();
            this.render();
        },

        setupFileUpload: function () {
            var me = this;

            var fileUpload = this.$('#fileupload-gpx').fileupload({
                acceptFileTypes: /(\.|\/)(gpx)$/i,
                url: this.uploadUrl,
                dataType: 'json',
                done: function (e, data) {

                    if (data.result.features && data.result.features.length) {
                        me.uploadDone(data.result.features[0]['geometry']);
                    } else {
                        me.$uploadStatus.html('Kunne ikke hente tur fra GPX-fil').addClass('has-error');
                    }

                },
                processstart: function (e) {
                    console.log('Processing started...');

                    me.$uploadStatus.removeClass('has-error').html('');
                    me.$uploadButton.addClass('disabled');
                    me.$uploadButtonLabel.attr('data-default-value', me.$uploadButtonLabel.text());
                    me.$uploadButtonLabel.html('Laster opp...');
                    me.$uploadSpinner.removeClass('hidden');
                },
                fail: function (e, data) {
                    var error = 'Ukjent feil ved opplasting av GPX.';

                    if (data && data.jqXHR && data.jqXHR.responseJSON && data.jqXHR.responseJSON.error) {
                        error = data.jqXHR.responseJSON.error;
                    }

                    me.$uploadStatus.html(error).addClass('has-error');
                },
                always: function (e, data) {
                    var uploadButtonDefaultValue = me.$uploadButtonLabel.attr('data-default-value');
                    me.$uploadButtonLabel.removeAttr('data-default-value');
                    me.$uploadButton.removeClass('disabled');
                    me.$uploadButtonLabel.html(uploadButtonDefaultValue);
                    me.$uploadSpinner.addClass('hidden');
                }
            }).prop('disabled', !$.support.fileInput).parent().addClass($.support.fileInput ? undefined : 'disabled');

        },

        uploadDone: function (geometry) {
            this.event_aggregator.trigger('map:loadGpxGeometry', geometry);
        },

        render: function () {
            this.$uploadButton = this.$el.find('.btn.btn-default');
            this.$uploadButtonLabel = this.$el.find('[data-container-for="btn-label"]');
            this.$uploadSpinner = this.$el.find('[data-container-for="gpx-upload-spinner"]');
            this.$uploadStatus = this.$el.find('[data-container-for="gpx-upload-status"]');

            return this;
        }

    });

}(DNT));
