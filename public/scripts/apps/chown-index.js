/* globals console */

/*
 * Copyright (c) $year, Den Norske Turistforening (DNT)
 *
 * https://github.com/Turistforeningen/turadmin
 */

define(function (require, exports, module) {
    "use strict";

    // Dependencies
    var $ = require('jquery'),
        _ = require('underscore'),
        Backbone = require('backbone'),
        state = require('state');

    var objects = {};
    var objectType;
    var currentOwnerId;
    var $list = $('#objects ul');

    var onObjectFetch = function (data, textStatus, jqXhr) {
        var $li = $('li[data-id="' + data._id + '"]');
        objects[data._id] = data;
        $li.html(data.navn + '<span class="done"></span>');
    };

    var  onObjectPatch = function (data, textStatus, jqXhr) {
        var id = this.url.split('/').reverse()[0];
        $('li[data-id="'+ id +'"] span').html('&#10004;');
    };

    $('#current-owner button').on('click', function () {
        currentOwnerId = $('#current-owner input').val();
        objectType = $('#current-owner select').val();

        $.ajax({
            url: '/restProxy/' + objectType + '/',
            data: 'privat.opprettet_av.id=' + currentOwnerId + '&limit=50&fields=navn,privat',
            processData: false,
            dataType: 'json',
            success: function (data, textStatus, jqXhr) {
                $list.html('');
                objects = {};

                if (data.documents && data.documents.length) {
                    for (var i = 0; i < data.documents.length; i++) {
                        var object = data.documents[i];

                        var $li = '<li data-id="' + object._id + '">' + object.navn + ' -  Henter detaljer... <span style="color: red; font-weight: bold;">Vennligst vent til alle er ferdige</span></li>';
                        $list.append($li);

                        $.ajax({
                            url: '/restProxy/' + objectType + '/' + object._id,
                            data: 'fields=navn,privat',
                            processData: false,
                            dataType: 'json',
                            success: onObjectFetch
                        });

                    }
                } else {
                    var $emptyLi = '<li>Fant ingen ' + objectType + ' tilhørende denne bruker med id <strong>' + currentOwnerId + '</strong></li>';
                    $list.append($emptyLi);
                }
            }
        });

    });

    $('#new-owner button').on('click', function () {
        var $listItems = $list.find('li');
        var $newOwner = $('#new-owner');

        var newOwner = {
            id: $newOwner.find('input[name="id"]').val(),
            navn: $newOwner.find('input[name="navn"]').val(),
            epost: $newOwner.find('input[name="epost"]').val()
        };

        for (var i = 0; i < $listItems.length; i++) {
            var $item = $listItems[i];
            var id = $item.dataset.id;
            var privat = objects[id].privat;

            privat.opprettet_av = newOwner;

            $.ajax({
                url: '/restProxy/' + objectType + '/' + id,
                data: {
                    privat: privat,
                    _method: 'PATCH'
                },
                method: 'PUT',
                dataType: 'json',
                success: onObjectPatch
            });
        }
    });
});
