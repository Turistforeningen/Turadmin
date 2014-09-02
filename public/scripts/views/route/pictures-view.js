var DNT = window.DNT || {};

(function (ns) {
    "use strict";

    ns.PicturesView = Backbone.View.extend({

        el: '#route-images',

        uploadUrl: '/upload/picture',

        events: {
            'sortstop #route-images-all-container': 'picturePositionUpdated',
            'updatePictureIndexes': 'updateIndexes'
        },

        $errorContainer: null,
        $errorMsg: null,

        initialize: function (options) {

            this.user = options.model.get('user');

            this.pictureCollection = this.model.get('pictureCollection');
            this.setupFileupload();

            this.pictureCollection.on('change:deleted', function () {
                // Render view when all pictures are removed
                if (this.pictureCollection.countPictures() === 0) {
                    this.render();
                }
            }, this);

            this.$('#route-images-all-container').sortable({
                items: '.picture-sortable',
                placeholder: 'sortable-placeholder col-sm-4'
            });

            this.$('#route-images-all-container').disableSelection();

            this.user = this.model.get('user');

            _.bindAll(this, 'picturePositionUpdated');
        },

        setupFileupload: function () {
            var ended = false;

            var that = this;
            var fileUpload = this.$('#fileupload').fileupload({
                acceptFileTypes: /(\.|\/)(gif|jpe?g|png)$/i,
                sequentialUploads: true,
                url: this.uploadUrl,
                dataType: 'json',

                // Before sending file
                submit: function (e, data) {
                    that.$errorContainer.addClass('hidden');

                    ended = false;
                    that.endProcessBar();

                    return true;
                },

                // Current file upload progress
                progress: function (e, data) {
                    if (data.loaded === data.total) {
                        that.startProcessBar();
                    }
                },

                // Total upload progress
                progressall: function (e, data) {
                    if (data.loaded === data.total) {
                        ended = true;
                    }
                    that.renderProgressBar(data);
                },

                // On response from server
                done: function (e, data) {
                    that.endProcessBar();

                    if (ended) {
                        setTimeout(that.hideAndResetProgressBar, 1500);
                    }

                    $.each(data.result.files, function (index, file) {
                        that.addNewFile(file);
                    });
                },

                // On error
                fail: function (e, data) {
                    that.endProcessBar();
                    that.hideAndResetProgressBar();
                    that.$errorMsg.html('En feil oppstod ved bildeopplasting. Du kan prøve igjen med et annet bilde.');
                    that.$errorContainer.removeClass('hidden');
                }
            }).prop('disabled', !$.support.fileInput)
                .parent().addClass($.support.fileInput ? undefined : 'disabled');
        },

        startProcessBar: function (data) {
            this.$("#progress").addClass("progress-striped active");
            this.$("#progress .progress-bar").html('<strong>Behandler bilde...</strong>');
        },

        endProcessBar: function (data) {
            this.$("#progress .progress-bar").html('');
            this.$($("#progress").removeClass("progress-striped active hidden"));
        },

        renderProgressBar: function (data) {
            var progress = parseInt(data.loaded / data.total * 100, 10);
            this.$("#progress .progress-bar").css('width', progress + '%');
        },

        hideAndResetProgressBar: function () {
            this.$($("#progress").addClass("hidden"));
            this.$("#progress .progress-bar").css('width', 0);
        },

        picturePositionUpdated: function (event, ui) {
            // Trig event on ui-item so that the correct picture item listener is trigged.
            // (In correct pictureView.js instance, which contains the model)
            ui.item.trigger('pictureDropped', ui.item.index());
        },

        updateIndexes: function (event, picture, index) {
            this.pictureCollection.reIndex(picture, index);
        },

        addNewFile: function (file) {
            file.ordinal = this.pictureCollection.getNextOrdinal();
            file.fotograf = {navn: this.user.get('navn'), epost: this.user.get('epost')};
            file.privat = {
                opprettet_av: {
                    id: this.user.get('id'),
                    navn: this.user.get('navn'),
                    epost: this.user.get('epost')
                }
            };
            var picture = new ns.Picture(file);
            this.pictureCollection.add(picture);
            this.appendPicture(picture);
            this.$("#noPictures").addClass("hidden");
            this.$("#hintInfo").removeClass("hidden");
            //setTimeout(this.hideAndResetProgressBar, 1500);
        },

        appendPicture: function (picture) {
            var view = new DNT.PictureView({model: picture, app: this.model});

            this.$("#route-images-all-container").append(view.render().el);
        },

        render: function () {

            if (this.pictureCollection.countPictures() === 0) {
                this.$("#noPictures").removeClass("hidden");
                this.$("#hintInfo").addClass("hidden");
            } else {
                this.$("#noPictures").addClass("hidden");
                this.$("#hintInfo").removeClass("hidden");
            }

            this.pictureCollection.each(this.appendPicture, this);

            this.$errorContainer = this.$el.find('[data-container-for="picture-upload-error"]');
            this.$errorMsg = this.$el.find('[data-container-for="picture-upload-error-msg"]');

            return this;
        }
    });
}(DNT));
