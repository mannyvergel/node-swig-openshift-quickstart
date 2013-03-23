var eu = require('mylib/expressUtils.js');

module.exports = function(req, res) {
  eu.render('login', req, res, {r:req.query.r});
}
