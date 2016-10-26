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
    var $table = $('#objects table tbody');

    var onObjectPatch = function (data, textStatus, jqXhr) {
        var id = this.url.split('/').reverse()[0];
        $('tr[data-id="'+ id +'"]').addClass('success');
    };

    var appendObject = function (obj) {
        var $tr = $('<tr data-id="' + obj._id + '" data-checked>');
        $tr.html([
            '<td><input type="checkbox" checked></td>',
            '<td><code>' + obj._id + '</code></td>',
            '<td>' + obj.navn + '</td>',
            '<td><code>' + obj.privat.opprettet_av.id + '</code></td>',
            '<td>' + obj.privat.opprettet_av.navn + '</td>',
            '<td>' + obj.privat.opprettet_av.epost + '</td>'
        ].join());

        $tr.find('input').on('change', function (e) {
            var $tr = $(this).parents('tr').first();
            if (this.checked) {
               $tr.attr('data-checked', '');
               $tr.removeClass('active');
            } else {
               $tr.removeAttr('data-checked');
               $tr.addClass('active');
            }
        });

        $table.append($tr);
    };

    $('table thead input[type="checkbox"]').on('click', function () {
        $('table tbody input[type="checkbox"]').prop('checked', this.checked ? true : false).trigger('change');
    });

    $('#current-owner button').on('click', function () {
        currentOwnerId = $('#current-owner input').val();
        objectType = $('#current-owner select').val();

        $.ajax({
            url: '/restProxy/' + objectType + '/',
            data: 'privat.opprettet_av.id=' + encodeURIComponent(currentOwnerId) + '&limit=50&fields=navn,privat',
            processData: false,
            dataType: 'json',
            success: function (data, textStatus, jqXhr) {
                $table.html('');
                objects = {};

                if (data.documents && data.documents.length) {
                    for (var i = 0; i < data.documents.length; i++) {
                        appendObject(data.documents[i]);
                        objects[data.documents[i]['_id']] = data.documents[i];
                    }
                } else {
                    var $emptyLi = '<tr><td colspan="6">Fant ingen ' + objectType + ' tilhørende bruker med id <code>' + currentOwnerId + '</code></td></tr>';
                    $table.html($emptyLi);
                }
            }
        });

    });

    $('#new-owner button').on('click', function () {
        var $tableItems = $table.find('tr[data-checked]');
        var $newOwner = $('#new-owner');

        var newOwner = {
            id: $newOwner.find('input[name="id"]').val(),
            navn: $newOwner.find('input[name="navn"]').val(),
            epost: $newOwner.find('input[name="epost"]').val()
        };

        for (var i = 0; i < $tableItems.length; i++) {
            var $item = $tableItems[i];
            var id = $item.dataset.id;
            var privat = objects[id].privat;

            privat.opprettet_av = newOwner;

            $.ajax({
                url: '/restProxy/' + objectType + '/' + id,
                data: JSON.stringify({
                    privat: privat,
                    _method: 'PATCH'
                }),
                method: 'PUT',
                dataType: 'json',
                contentType: 'application/json',
                success: onObjectPatch
            });
        }
    });
});
