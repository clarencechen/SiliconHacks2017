'use strict';

function authenticate(req, res, next) {
	console.log(JSON.stringify(req.session))
	if(req.session && req.session.user)
		next()
	else
		return res.status(401).send('Permission Denied')
}

module.exports = function(app) {
	var translate = require('../controllers/translate.js')
	var auth = require('../controllers/auth.js')
	var match = require('../controllers/match.js')

	app.route('/').get((req, res, next) => {
		//main page
		if(req.session && req.session.user)
			res.redirect('/chat.html')
		else
			res.redirect('/login')
	})
	//authentication required for these endpoints
	app.route('/client/*').all(authenticate)
	app.route('/chat.html').all(authenticate)
	//public api
	app.route('/login')
	.get((req, res) => res.redirect('/login.html'))
	.post(auth.get_user)
	app.route('/signup')
	.get((req, res) => res.redirect('/signup.html'))
	.post(auth.new_user)
	app.route('/logout')
	.post(auth.logout)
	//restricted api
	app.route('/client/info')
	.post(match.user_info)
	app.route('/client/match')
	.post(match.match_text)
	app.route('/client/translate')
	.post(translate.translate)
}
