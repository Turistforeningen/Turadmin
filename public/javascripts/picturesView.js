var DNT = window.DNT || {};

(function (ns) {
    "use strict";

    ns.PicturesView = Backbone.View.extend({

        el: "#pictureContainer",

        picturesCollection: undefined,

        uploadUrl: "/upload",

        initialize : function () {
            this.pictureCollection = this.model.get("pictureCollection");
            this.setupFileupload();
        },

        setupFileupload: function () {
            var that = this;
            var fileUpload = $('#fileupload').fileupload({
                acceptFileTypes: /(\.|\/)(gif|jpe?g|png)$/i,
                url: this.uploadUrl,
                dataType: 'json',
                done: function (e, data) {
                    $.each(data.result.files, function (index, file) {
                        that.addNewFile(file);
                    });
                },
                progressall: function (e, data) {
                    that.renderProgressBar(data);
                },
                fail: function (e, data) {
                    console.error("fail", e);
                }
            }).prop('disabled', !$.support.fileInput)
                .parent().addClass($.support.fileInput ? undefined : 'disabled');

            fileUpload.on("fileuploadprocessfail", function (e, data) {
                console.log(data.files[0].error);
            });
        },

        addNewFile: function (file) {
            this.pictureCollection.add(file);
            $(this.el).append("<p>" + file.navn + "</p>");
        },

        renderProgressBar: function (data) {
            var progress = parseInt(data.loaded / data.total * 100, 10);
            this.$("#progress").css('width', progress + '%');
        },

        render: function () {
            //loop through poiCollection and append pictureTemplateViews
            return this;
        }
    });
}(DNT));
