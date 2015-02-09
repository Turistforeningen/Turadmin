requirejs.config({
    config: {
        text: {
            onXhr: function (xhr, url) {
                // Called after the XHR has been created and after the
                // xhr.open() call, but before the xhr.send() call.
                // Useful time to set headers.
                // xhr: the xhr object
                // url: the url that is being used with the xhr object.
                xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
            }
        }
    },
    baseUrl: '/',
    paths: {

        // Libs
        'jquery': '/lib/jquery-1.11.1/jquery.min',
        'jquery-ui': '/lib/jquery-ui-1.11.1/jquery-ui.min',
        'backbone': '/lib/backbone-1.1.2/backbone',
        'backbone-stickit': '/lib/backbone.stickit-0.8.0/backbone.stickit',
        'backbone-validation': '/lib/backbone-validation-0.9.1/backbone-validation',
        'bootstrap': '/lib/bootstrap-3.2.0-dist/js/bootstrap',
        'ckeditor-core':'/lib/ckeditor-4.4.7/ckeditor',
        'ckeditor-jquery':'/lib/ckeditor-4.4.7/adapters/jquery',
        'leaflet': '/lib/leaflet-0.7.2/leaflet-src',
        'leaflet-draw': '/lib/Leaflet.draw/leaflet.draw',
        'leaflet-routing': '/lib/routing/L.Routing',
        'leaflet-routing-lineutilsnapping': '/lib/routing/utils/LineUtil.Snapping',
        'leaflet-routing-markersnapping': '/lib/routing/utils/Marker.Snapping',
        'leaflet-routing-storage': '/lib/routing/L.Routing.Storage',
        'leaflet-routing-draw': '/lib/routing/L.Routing.Draw',
        'leaflet-routing-edit': '/lib/routing/L.Routing.Edit',
        'jquery.fileupload': '/lib/jquery.fileupload/js/jquery.fileupload',
        'jquery.ui.widget': '/lib/jquery.fileupload/js/vendor/jquery.ui.widget',
        'jquery.iframe-transport': '/lib/jquery.fileupload/js/jquery.iframe-transport',
        'jquery.fileupload-process': '/lib/jquery.fileupload/js/jquery.fileupload-process',
        'jquery.iframe-validate': '/lib/jquery.fileupload/js/jquery.fileupload-validate',
        'jquery-ssr': '/lib/jquery.ssr-1.0.0/jQuery.SSR',
        'select2': '/lib/select2-3.5.1/select2',
        'select2-locale_no': '/lib/select2-3.5.1/select2_locale_no',
        'text': '/lib/text-2.0.12/text',
        'underscore': '/lib/underscore-1.7.0/underscore',
        'xmltojson': '/lib/xmltojson-1.1/xmltojson',

        'routing': '/scripts/routing',

        // Path aliases
        'apps': '/scripts/apps',
        'models': '/scripts/models',
        'collections': '/scripts/collections',
        'views': '/scripts/views',
        'templates': '/templates',
    },
    shim: {
        'backbone-validation': {
            deps: ['backbone', 'underscore', 'jquery'],
            exports: 'Backbone.Validation',
            init: function (Backbone, _, $) {
                Backbone.Validation.configure({
                    // Since we are automatically updating the model, we want the model
                    // to also hold invalid values, otherwise, we might be validating
                    // something else than the user has entered in the form.
                    // See: http://thedersen.com/projects/backbone-validation/#configuration/force-update
                    forceUpdate: true,

                    // This configures what selector that will be used to look up a form element in the view.
                    // By default it uses name, but if you need to look up elements by class name or id
                    // instead, there are two ways to configure this.
                    selector: 'data-model-validation-field-name'
                });

                // Extend the callbacks to work with Bootstrap, as used in this example
                // See: http://thedersen.com/projects/backbone-validation/#configuration/callbacks
                _.extend(Backbone.Validation.callbacks, {

                    valid: function (view, attr, selector) {
                        var $el = $('[data-model-validation-field-name="' + attr + '"]'),
                            $formGroup = $el.closest('.form-group'),
                            $errorMsg = $el.next('.error-msg');

                        $formGroup.removeClass('has-error');

                        if ($errorMsg.length) {
                            $errorMsg.html('').addClass('hidden');
                        }
                    },

                    invalid: function (view, attr, error, selector) {
                        var $el = $('[data-model-validation-field-name="' + attr + '"]'),
                            $formGroup = $el.closest('.form-group'),
                            $errorMsg = $el.next('.error-msg');

                        $formGroup.addClass('has-error');

                        if ($errorMsg.length) {
                            $errorMsg.html(error).removeClass('hidden');
                        } else {
                            $el.after('<span class="help-block error-msg">' + error + '</span>');
                        }
                    }
                });
            }
        },
        'bootstrap': {
            deps: ['jquery', 'jquery-ui']
        },
        'ckeditor-jquery':{
            deps:['jquery', 'ckeditor-core']
        },
        'jquery-ui': {
            deps: ['jquery']
        },
        'jquery.fileupload': {
            deps: ['jquery']
        },
        'routing': {
            deps: ['leaflet-routing'],
            exports: 'Routing'
        },
        'select2': {
            exports: 'jQuery.fn.select2'
        },
        'select2-locale_no': {
            deps: ['select2'],
        },
        'xmltojson': {
            exports: 'xmlToJSON'
        },
        'jquery.ui.widget': {
            deps: ['jquery']
        },
        'jquery.iframe-transport': {
            deps: ['jquery']
        },
        'jquery.fileupload-process': {
            deps: ['jquery']
        },
        'jquery.iframe-validate': {
            deps: ['jquery']
        },
        'jquery-ssr': {
            deps: ['jquery', 'xmltojson'],
            exports: 'jQuery.fn.SSR'
        },
        'leaflet-draw': {
            deps: ['leaflet']
        },
        'leaflet-routing': {
            deps: ['leaflet'],
            exports: 'L.Routing'
        },
        'leaflet-routing-lineutilsnapping': {
            deps: ['leaflet-routing']
        },
        'leaflet-routing-storage': {
            deps: ['leaflet-routing']
        },
        'leaflet-routing-draw': {
            deps: ['leaflet-routing']
        },
        'leaflet-routing-edit': {
            deps: ['leaflet-routing']
        },
        'leaflet-routing-markersnapping': {
            deps: ['leaflet-routing']
        }
    }
});
