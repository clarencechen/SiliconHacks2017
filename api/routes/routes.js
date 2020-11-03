'use strict';

function authenticate(req, res, next) {
	if(req.session && req.session.user)
		next()
	else
		return res.status(401).send('Permission Denied')
}

module.exports = function(app) {
	const options = {root: '/app/public'}
	const translate = require('../controllers/translate.js')
	const auth = require('../controllers/auth.js')
	const match = require('../controllers/match.js')

	app.route('/').get((req, res, next) => {
		//main page
		if(req.session && req.session.user)
			res.sendFile('chat.html', options)
		else
			res.sendFile('login.html', options)
	})
	//authentication required for these endpoints
	app.route('/client/*').all(authenticate)
	app.route('/chat.html').all(authenticate)
	//public api
	app.route('/login')
	.get((req, res) => res.sendFile('login.html', options))
	.post(auth.get_user)
	app.route('/signup')
	.get((req, res) => res.sendFile('signup.html', options))
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
