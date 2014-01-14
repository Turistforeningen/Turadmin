
/*
 * Copyright (c) $year, Den Norske Turistforening (DNT)
 *
 * https://github.com/Turistforeningen/turadmin
 */

/*
 * GET home page.
 */

exports.addRoute = function(req, res){
  res.render('addRoute', { title: 'Opprett ny tur' });
};