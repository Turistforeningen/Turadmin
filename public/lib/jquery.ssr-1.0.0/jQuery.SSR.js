/*
 * jQuery SSR, an easy to use wrapper for Kartverket SSR base, returning JSON.
 *
 * Written by Hans Kristian Flaatten for Turistforeningen,
 * http://www.turistforeningen.no
 *
 * Version 1.0.0
 *
 * Full source at https://github.com/Turistforeningen/jQuery.SSR
 * Copyright (c) 2014 Turistforeningen @  http://www.turistforeningen.com
 *
 * MIT License, https://github.com/Turistforeningen/jQuery.SSR/blob/master/LICENSE
 *
*/

(function($) {
  "use strict";

  $.fn.SSR = function(search) {
    var dfd, params, parse, res;

    dfd = new jQuery.Deferred();

    if (typeof search === 'object') {
      setTimeout(function() { dfd.reject(new Error('Not implemented')); }, 0);
      return dfd;
    } else if (typeof search === 'string') {
      params = 'navn=' + $.trim(search) + '*&epsgKode=4326'
    } else if (typeof search === 'number') {
      params = 'ssrId=' + search + '&epsgKode=4326'
    } else {
      setTimeout(function() { dfd.reject(new Error('Not supported')); }, 0);
      return dfd;
    }

    parse = function(xml) {
      var json, res;

      json = xmlToJSON.parseString(xml, {
        mergeCDATA: false,
        xmlns: false,
        childrenAsArray: false,
      });

      if (!json.sokRes) {
        return { status: { ok: false, melding: 'Ukjent respons'}, stedsnavn: [] }
      }

      res = {
        status: {
          ok: json.sokRes.sokStatus.ok._text,
          melding: json.sokRes.sokStatus.melding._text
        },
        stedsnavn: []
      }

      // Parsed XML data are wrapped in _text objects so we need to remove them
      // before we send this result back...
      if (json.sokRes.stedsnavn) {
        if (!(json.sokRes.stedsnavn instanceof Array)) {
          json.sokRes.stedsnavn = [json.sokRes.stedsnavn];
        }
        for(var i = 0; i < json.sokRes.stedsnavn.length; i++) {
          var keys = Object.keys(json.sokRes.stedsnavn[i]);
          for (var j = 0; j < keys.length; j++) {
            json.sokRes.stedsnavn[i][keys[j]] = json.sokRes.stedsnavn[i][keys[j]]._text;
          }
          res.stedsnavn.push(json.sokRes.stedsnavn[i]);
        }
      }

      return res;
    };

    $.ajax({
      type: 'GET',
      url: 'https://ws.geonorge.no/SKWS3Index/ssr/sok?' + params,
      dataType: 'text'
    })
    .error(function(xml) { res = parse(xml); })
    .done(function(xml) { res = parse(xml); })
    .always(function() { dfd.resolve(res); });

    return dfd;
  };
  $.fn.SSR.version = '1.0.0a1';
})(jQuery);

