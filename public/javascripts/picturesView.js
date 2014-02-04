var DNT = window.DNT || {};

(function (ns) {
    "use strict";

    ns.PicturesView = Backbone.View.extend({

        el: "#route-images",

        uploadUrl: "/upload",

        events : {
            "sortstop #route-images-all-container": "picturePositionUpdated",
            "updatePictureIndexes": "updateIndexes"
        },

        initialize : function () {
            this.pictureCollection = this.model.get("pictureCollection");
            this.setupFileupload();
            if (this.pictureCollection.length > 0) {
                this.$("#noPictures").addClass("hidden");
                this.$("#hintInfo").removeClass("hidden");
            }
            this.pictureCollection.on("change:deleted", function () {
                //Render view when all pictures are removed
                if (this.pictureCollection.countPictures() === 0) {
                    this.render();
                }
            }, this);
            this.$("#route-images-all-container").sortable({items: ".picture-sortable"});
            this.$("#route-images-all-container").disableSelection();
            _.bindAll(this, "picturePositionUpdated");
        },

        setupFileupload: function () {
            var that = this;
            var fileUpload = this.$('#fileupload').fileupload({
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

            fileUpload.on("fileuploadprocessdone", function (e, data) {
                that.$($("#progress").removeClass("hidden"));
            });
        },

        picturePositionUpdated: function (event, ui) {
            //trigg event on ui-item so that the correct picture item listener is trigged.
            // (In correct pictureView.js instance, which contains the model)
            ui.item.trigger('pictureDropped', ui.item.index());
        },

        updateIndexes: function (event, picture, index) {
            this.pictureCollection.reIndex(picture, index);
        },

        addNewFile: function (file) {
            file.ordinal = this.pictureCollection.getNextOrdinal();
            var picture = new DNT.Picture(file);
            this.pictureCollection.add(picture);
            var view = new DNT.PictureView({ model: picture });
            this.$("#route-images-all-container").append(view.render().el);
            this.$("#noPictures").addClass("hidden");
            this.$("#hintInfo").removeClass("hidden");
            setTimeout(this.hideAndResetProgressBar, 1500);

        },

        renderProgressBar: function (data) {
            var progress = parseInt(data.loaded / data.total * 100, 10);
            this.$("#progress .progress-bar").css('width', progress + '%');
        },

        hideAndResetProgressBar: function () {
            this.$($("#progress").addClass("hidden"));
            this.$("#progress .progress-bar").css('width', 0);
        },

        render: function () {
            if (this.pictureCollection.countPictures() === 0) {
                this.$("#noPictures").removeClass("hidden");
                this.$("#hintInfo").addClass("hidden");
            }
            //loop through poiCollection and append pictureTemplateViews
            return this;
        }
    });
}(DNT));
