var eu = require('mylib/expressUtils.js');
module.exports = function(app) {
	app.get('/', require('./home.js'));

	app.get('/login', require('./login.js'));
	app.post('/login', require('./login.post.js'));
	app.get('/login-success', eu.login, function(req,res) {
		if (req.query.r) {
			res.redirect(req.query.r);
		} else {
			res.redirect('/');
		}
	});
	app.get('/logout', function(req, res){
	  req.logout();
	  res.redirect('/');
	});
}