var eu = require('mylib/expressUtils.js');
module.exports = function(req, res) {
  eu.render('home', req, res, {});
}