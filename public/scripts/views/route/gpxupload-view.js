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

        initialize: function (options) {
            this.setupFileUpload();
        },

        setupFileUpload: function () {
            var me = this;

            var fileUpload = this.$('#fileupload-gpx').fileupload({
                acceptFileTypes: /(\.|\/)(gpx)$/i,
                url: this.uploadUrl,
                dataType: 'json',
                done: function (e, data) {
                    me.uploadDone(data.result.features[0]['geometry']);
                },
                // progressall: function (e, data) {
                //     me.renderProgressBar(data);
                // },
                fail: function (e, data) {
                    var error = 'Ukjent feil ved opplasting av GPX.';

                    if (data && data.jqXHR && data.jqXHR.responseJSON && data.jqXHR.responseJSON.error) {
                        error = data.jqXHR.responseJSON.error;
                    }

                    me.$('[data-placeholder-for="gpx-upload-status"]').html(error).addClass('has-error');
                }
            }).prop('disabled', !$.support.fileInput).parent().addClass($.support.fileInput ? undefined : 'disabled');

            fileUpload.on('fileuploadprocessfail', function (e, data) {
                me.$('[data-placeholder-for="gpx-upload-status"]').html(data.files[data.index].error).addClass('has-error');
            });

            fileUpload.on('fileuploadprocessdone', function (e, data) {
                me.$('[data-placeholder-for="gpx-upload-status"]').removeClass('has-error').html('');
            });
        },

        uploadDone: function (geometry) {
            this.event_aggregator.trigger('map:loadGpxGeometry', geometry);
        },

        render: function () {
            return this;
        }

    });

}(DNT));
