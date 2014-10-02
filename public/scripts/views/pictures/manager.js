/*
 * Copyright (c) $year, Den Norske Turistforening (DNT)
 *
 * https://github.com/Turistforeningen/turadmin
 */

define(function (require, exports, module) {
    "use strict";

    // Dependencies
    var $ = require('jquery'),
        Backbone = require('backbone'),
        Template = require('text!templates/pictures/manager.html'),
        PictureModel = require('models/picture'),
        PictureEditView = require('views/pictures/edit'),
        PictureCollection = require('collections/pictures'),
        User = require('models/user'),
        user = new User();

    require('jquery-ui');
    require('jquery.fileupload');
    require('jquery.iframe-transport');
    require('jquery.fileupload-process');
    require('jquery.iframe-validate');

    // Module
    return Backbone.View.extend({

        el: $('[data-view="pictures-manager"]'),

        uploadUrl: '/upload/picture',
        // events: {
        //     'picturesortstop': 'updateIndexes'
        // },

        events: {
            // 'sortstop #route-pictures-all-container': 'picturePositionUpdated',
            'updatePictureIndexes': 'updateIndexes'
        },

        initialize: function (options) {

            // Set scope of methods to this view
            _.bindAll(this, 'picturePositionUpdated', 'updateIndexes');

            // If no picture collection is passed, create a new one
            this.pictures = options.pictures || new PictureCollection();

            // TODO: Map... Add some logic to set up a new map if one is not passed as an option
            this.map = options.map;

            this.pictures.on('change:deleted', function () {
                // Render view when all pictures are removed
                if (this.pictures.countPictures() === 0) {
                    this.render();
                }
            }, this);


        },

        appendPicture: function (picture) {
            var pictureEditView = new PictureEditView({
                model: picture,
                map: this.map
            }).render();

            this.$('[data-container-for="all-pictures-container"]').append(pictureEditView.el);
        },

        render: function () {
            // Using Underscore we can compile our template with data
            var data = {};
            var compiledTemplate = _.template(Template, data);
            // Append our compiled template to this Views "el"

            this.$el.html(compiledTemplate);
            this.pictures.each(this.appendPicture, this);

            this.setupFileupload();

            this.$errorContainer = $('[data-container-for="picture-upload-error"]');

            this.$('[data-container-for="all-pictures-container"]').sortable({
                items: '.picture.sortable',
                placeholder: 'sortable-placeholder col-sm-4',
                stop: $.proxy(this.onSortStop, this)
            });

            return this;
        },


        picturePositionUpdated: function (e, ui) {
            // Trig event on ui-item so that the correct picture item listener is trigged.
            // (In correct PictureEditView.js instance, which contains the model)
            ui.item.trigger('pictureDropped', ui.item.index());
        },

        updateIndexes: function (e, picture, index) {
            this.pictures.reIndex(picture, index);
        },

        onSortStop: function (e, ui) {
            // Trig event on ui-item so that the correct picture item listener is trigged.
            // (In correct PictureEditView.js instance, which contains the model)
            ui.item.trigger('pictureDropped', ui.item.index());

            // ui.item.trigger('picturesortstop', ui.item.index());
        },

        setupFileupload: function () {
            var ended = false;

            var that = this;
            var fileUpload = this.$('#fileupload').fileupload({
                acceptFileTypes: /(\.|\/)(gif|jpe?g|png)$/i,
                sequentialUploads: true,
                url: this.uploadUrl,
                dataType: 'json',
                maxFileSize: 6000000,

                // Before sending file
                submit: function (e, data) {
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
                    console.error(e, data)

                    that.endProcessBar();
                    that.hideAndResetProgressBar();
                    that.addUploadError('En feil oppstod ved bildeopplasting. Du kan prøve igjen med et annet bilde.');
                }
            });

            fileUpload.prop('disabled', !$.support.fileInput).parent().addClass($.support.fileInput ? undefined : 'disabled');

            fileUpload.on('fileuploadadd', function (e, data) {
                that.resetUploadErrors();
            });

            fileUpload.on('fileuploadprocessfail', function (e, data) {
                var errorMsg = '';

                if ((data.files.length > 0) && (data.files.length === data.originalFiles.length)) {
                    if (data.files.length === 1) {
                        errorMsg = 'Bildet du forsøkte å laste opp var for stort eller feil format, og ble ikke lastet opp. Hvert bilde må være mindre enn 6 MB og av typen gif, jpg eller png.';
                    } else {
                        errorMsg = 'Bildene du forsøkte å laste opp var for store eller feil format, og ble ikke lastet opp. Hvert bilde må være mindre enn 6 MB og av typen gif, jpg eller png.';
                    }

                } else {
                    errorMsg = 'Et eller flere av bildene var for store eller feil format, og ble ikke lastet opp. Hvert bilde må være mindre enn 6 MB og av typen gif, jpg eller png.. Bildene som ikke overstiger denne grensen blir lastet opp.';
                }

                that.addUploadError(errorMsg);
            });

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

        addNewFile: function (file) {
            file.fotograf = {navn: user.get('navn'), epost: user.get('epost')};
            var picture = new PictureModel(file);
            this.pictures.add(picture);
            this.appendPicture(picture);
            this.$("#noPictures").addClass("hidden");
            this.$("#hintInfo").removeClass("hidden");
        },

        addUploadError: function (err) {
            var $error = $('<div class="alert alert-danger"></div>').text(err);
            this.$errorContainer.append($error);
        },

        resetUploadErrors: function () {
            this.$errorContainer.html('');
        }

//         render: function () {

//             if (this.pictureCollection.countPictures() === 0) {
//                 this.$("#noPictures").removeClass("hidden");
//                 this.$("#hintInfo").addClass("hidden");
//             } else {
//                 this.$("#noPictures").addClass("hidden");
//                 this.$("#hintInfo").removeClass("hidden");
//             }

//             this.pictureCollection.each(this.appendPicture, this);

//             this.$errorContainer = this.$el.find('[data-container-for="picture-upload-error"]');

//             return this;
//         }


    });

});


//         events: {
//             'sortstop #route-pictures-all-container': 'picturePositionUpdated',
//             'updatePictureIndexes': 'updateIndexes'
//         },

//         $errorContainer: null,

//         initialize: function (options) {

//             user = options.model.get('user');

//             this.pictureCollection = this.model.get('pictureCollection');

//             this.pictureCollection.on('change:deleted', function () {
//                 // Render view when all pictures are removed
//                 if (this.pictureCollection.countPictures() === 0) {
//                     this.render();
//                 }
//             }, this);

//             this.$('#route-pictures-all-container').sortable({
//                 items: '.picture-sortable',
//                 placeholder: 'sortable-placeholder col-sm-4'
//             });

//             this.$('#route-pictures-all-container').disableSelection();

//             user = this.model.get('user');

//             _.bindAll(this, 'picturePositionUpdated');
//         },



//         startProcessBar: function (data) {
//             this.$("#progress").addClass("progress-striped active");
//             this.$("#progress .progress-bar").html('<strong>Behandler bilde...</strong>');
//         },

//         endProcessBar: function (data) {
//             this.$("#progress .progress-bar").html('');
//             this.$($("#progress").removeClass("progress-striped active hidden"));
//         },

//         renderProgressBar: function (data) {
//             var progress = parseInt(data.loaded / data.total * 100, 10);
//             this.$("#progress .progress-bar").css('width', progress + '%');
//         },

//         hideAndResetProgressBar: function () {
//             this.$($("#progress").addClass("hidden"));
//             this.$("#progress .progress-bar").css('width', 0);
//         },

//         picturePositionUpdated: function (event, ui) {
//             // Trig event on ui-item so that the correct picture item listener is trigged.
//             // (In correct PictureEditView.js instance, which contains the model)
//             ui.item.trigger('pictureDropped', ui.item.index());
//         },

//         updateIndexes: function (event, picture, index) {
//             this.pictureCollection.reIndex(picture, index);
//         },

//         addNewFile: function (file) {

//             file.fotograf = {navn: user.get('navn'), epost: user.get('epost')};
//             file.privat = {
//                 opprettet_av: {
//                     id: user.get('id'),
//                     navn: user.get('navn'),
//                     epost: user.get('epost')
//                 }
//             };
//             var picture = new ns.Picture(file);
//             this.pictureCollection.add(picture);
//             this.appendPicture(picture);
//             this.$("#noPictures").addClass("hidden");
//             this.$("#hintInfo").removeClass("hidden");
//             //setTimeout(this.hideAndResetProgressBar, 1500);
//         },

//         addUploadError: function (err) {
//             var $error = $('<div class="alert alert-danger"></div>').text(err);
//             this.$errorContainer.append($error);
//         },

//         resetUploadErrors: function () {
//             this.$errorContainer.html('');
//         },

//         appendPicture: function (picture) {
//             var view = new DNT.PictureEditView({model: picture, app: this.model});

//             this.$("#route-pictures-all-container").append(view.render().el);
//         },

//         render: function () {

//             if (this.pictureCollection.countPictures() === 0) {
//                 this.$("#noPictures").removeClass("hidden");
//                 this.$("#hintInfo").addClass("hidden");
//             } else {
//                 this.$("#noPictures").addClass("hidden");
//                 this.$("#hintInfo").removeClass("hidden");
//             }

//             this.pictureCollection.each(this.appendPicture, this);

//             this.$errorContainer = this.$el.find('[data-container-for="picture-upload-error"]');

//             return this;
//         }
//     });
// }(DNT));
