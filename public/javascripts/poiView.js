/*
 * Copyright (c) $year, Den Norske Turistforening (DNT)
 *
 * https://github.com/Turistforeningen/turadmin
 */

var DNT = window.DNT || {};

(function (ns) {
    "use strict";

    var poiViewBindings = {
        '[name = "navn"]' : "navn",
        '[name = "beskrivelse"]' : "beskrivelse",
        '[name = "kategori"]': "kategori",
        '#poiHeader': "navn"
        //'[name = "tags"]' : "tags"
    };


    ns.PoiView = Backbone.View.extend({

        template: _.template($('#poiTemplate').html()),

        initialize : function () {
        },

        events: {
            'click #deletePoi': 'deletePoi'
        },

        deletePicture: function (e) {
            e.preventDefault();
            this.model.deletePoi();
            this.render();
        },

        render: function () {

            if (this.model.isDeleted()) {
                this.remove();
            } else {
                var json = this.model.toJSON();
                json.cid = this.model.cid;
                var html =  this.template(json);
                $(this.el).html(html);
                this.stickit(this.model, poiViewBindings);
            }
            return this;
        }
    });
}(DNT));
