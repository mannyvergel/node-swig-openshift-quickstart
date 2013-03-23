module.exports = function(app) {
	app.get('/', require('./home.js'));

	app.get('/login', require('./login.js'));
	app.post('/login', require('./login.post.js'));
}