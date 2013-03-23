var passport = require('passport');
module.exports =  function(req,res) {
	
	var param = "";
	if (req.body.r) {
		param = "?r=" + encodeURIComponent(req.body.r);
	}
	//console.log("param: " + param);
	passport.authenticate('local', { successRedirect: '/login-success' + param,
                                   failureRedirect: '/login',
                                   failureFlash: true })(req,res);
}