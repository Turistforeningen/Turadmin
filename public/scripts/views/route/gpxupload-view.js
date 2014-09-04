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
                processstart: function (e) {
                    me.renderUploading();
                },
                always: function (e, data) {
                    me.renderReady();
                },
                done: function (e, data) {

                    if (data.result.features && data.result.features.length) {
                        me.uploadDone(data.result.features[0]['geometry']);
                        me.$uploadStatus.html('Turen er hentet fra GPX-fil til kart').addClass('success');

                    } else {
                        me.$uploadStatus.html('Kunne ikke hente tur fra GPX-fil').addClass('error');
                    }

                },
                fail: function (e, data) {
                    var error = 'Ukjent feil ved opplasting av GPX.';

                    if (data && data.jqXHR && data.jqXHR.responseJSON && data.jqXHR.responseJSON.error) {
                        error = data.jqXHR.responseJSON.error;
                    }

                    me.$uploadStatus.html(error).addClass('error');
                }
            }).prop('disabled', !$.support.fileInput).parent().addClass($.support.fileInput ? undefined : 'disabled');

            fileUpload.on('fileuploadprocessfail', function (e, data) {
                me.renderReady();
                me.$uploadStatus.html(data.files[0].error).addClass('has-error');
                // console.log(data.files[0].error);
            });

        },

        uploadDone: function (geometry) {
            this.event_aggregator.trigger('map:loadGpxGeometry', geometry);
        },

        renderUploading: function () {
            this.$uploadStatus.removeClass('error').removeClass('success').html('');
            this.$uploadButton.addClass('disabled');
            this.$uploadButtonLabel.attr('data-default-value', this.$uploadButtonLabel.text());
            this.$uploadButtonLabel.html('Laster opp...');
            this.$uploadSpinner.removeClass('hidden');
        },

        renderReady: function () {
            var uploadButtonDefaultValue = this.$uploadButtonLabel.attr('data-default-value');

            this.$uploadButtonLabel.removeAttr('data-default-value');
            this.$uploadButton.removeClass('disabled');
            this.$uploadButtonLabel.html(uploadButtonDefaultValue);
            this.$uploadSpinner.addClass('hidden');
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
