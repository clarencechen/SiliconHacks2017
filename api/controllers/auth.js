process.env = require('dotenv-safe').load().parsed

const argon2 = require('argon2')

const db = require('./db.js')

const checkLogin = 'SELECT hash FROM users WHERE username=$1'

const insertUser = `INSERT INTO
users(username, hash, twitter, language, demographics)
VALUES($1, $2, $3, $4, $5)`

//create new account and login
async function create(data) {
	try {
		// hash password
		const hash = await argon2.hash(data.pwd + process.env.SALT)
		const success = db.query(insertUser, [
			data.user,
			hash,
			data.tw,
			data.lang,
			data.dmgs])
		const response = await login(data.user, data.pwd)
		return response
	} catch(e) {
		throw e
	}
}

//login
async function login(sess, id, pwd) {
	try {
		const { rows } = db.query(checkLogin, [id])
		// check hash
		if(rows.length < 1)
			return false
		const success = await argon2.verify(rows[0].hash, pwd + process.env.SALT)
		if(success)
			sess.user = id
		return success
	} catch(e) {
		throw e 
	}
}

//TODO: logout from all user sessions

exports.new_user = function(req, res) {
	console.log("Creating user" + req.body.user)
	// TODO: sanitize input
	create(req.body)
		.then((out) => res.json({success: out}))
		.catch((e) => res.status(500).json(e))
}

exports.get_user = function(req, res) {
	login(req.session, req.body.username, req.body.password)
		.then((out) => res.json({success: out}))
		.catch((e) => res.status(500).json(e))
}

//logout from current session
exports.logout = function(req, res) {
	if(req.session && req.session.user) {
		delete req.session.user
		return res.json({success: true})
	} else {
		return res.json({success: false})
	}
}