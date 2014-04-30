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
                    me.uploadDone(data.result.files[0]['features'][0]['geometry']);
                },
                // progressall: function (e, data) {
                //     me.renderProgressBar(data);
                // },
                fail: function (e, data) {
                    // console.error('Upload failed.', e);
                }
            }).prop('disabled', !$.support.fileInput).parent().addClass($.support.fileInput ? undefined : 'disabled');

            fileUpload.on('fileuploadprocessfail', function (e, data) {
                me.$('[data-placeholder="gpx-upload-status"]').html(data.files[0].error).addClass('has-error');
                // console.log(data.files[0].error);
            });

            fileUpload.on('fileuploadprocessdone', function (e, data) {
                me.$('[data-placeholder="gpx-upload-status"]').removeClass('has-error').html('');
            });
        },

        uploadDone: function (geometry) {
            console.log('File is uploaded.');
            this.event_aggregator.trigger('map:loadGpxGeometry', geometry);
        },

        render: function () {
            return this;
        }

    });

}(DNT));
