var DNT = window.DNT || {};

(function (ns) {
    "use strict";

    ns.PicturesView = Backbone.View.extend({

        el: "#pictureContainer",

        uploadUrl: "/upload",

        initialize : function () {
            this.setupFileupload();
        },

        setupFileupload: function () {
            var that = this;
            $('#fileupload').fileupload({
                acceptFileTypes: /(\.|\/)(gif|jpe?g|png)$/i,
                url: this.uploadUrl,
                dataType: 'json',
                done: function (e, data) {
                    $.each(data.result.files, function (index, file) {
                        that.addNewFile(file);
                    });
                },
                submit: function (e, data) {
                },
                progressall: function (e, data) {
                    that.renderProgressBar(data);
                },
                fail: function (e, data) {
                    console.error("fail", e);
                }
            }).prop('disabled', !$.support.fileInput)
                .parent().addClass($.support.fileInput ? undefined : 'disabled');
        },

        addNewFile: function (file) {
            $(this.el).append("<p>" + file.navn + "</p>");
        },

        renderProgressBar: function (data) {
            var progress = parseInt(data.loaded / data.total * 100, 10);
            this.$("#progress").css('width', progress + '%');
        },

        render: function () {
            return this;
        }
    });
}(DNT));
