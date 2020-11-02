if (process.env.NODE_ENV !== 'production')
	process.env = require('dotenv-safe').load().parsed

const argon2 = require('argon2')

const db = require('./db.js')

const checkLogin = "SELECT hash FROM users WHERE username=$1"
const checkExists = "SELECT COUNT(*) FROM users WHERE username=$1"

const insertUser = `INSERT INTO
users(username, hash, twitter, lang, demographics)
VALUES($1, $2, $3, $4, $5)`

//create new account and login
async function create(data, sess) {
	try {
		if (((data.id.length || 0) < 3) || ((data.lang.length || 0) < 2) || !data.dmgs) {
			return {success: false, reason: 'Malformed request, please try again.'}
		} else if ((data.pwd.length || 0) < 8) {
			return {success: false, reason: 'Passwords need to be at least 8 characters in length, please try again.'}
		} else {
			const { rows } = await db.query(checkExists, [data.id])
			if (rows[0].count > 0)
				return {success: false, reason: 'Account already exists, please login with existing account.'}
			// hash password
			const hash = await argon2.hash(data.pwd + process.env.SALT)
			const s = await db.query(insertUser, [data.id, hash,
				data.tw, data.lang, data.dmgs])
			const response = await login(data.id, data.pwd, sess)
			return response
		}
	} catch(e) {
		return {success: false, reason: e.message}
	}
}

//login
async function login(id, pwd, sess) {
	try {
		const { rows } = await db.query(checkLogin, [id])
		// check hash
		if(rows.length < 1)
			return {success: false, reason: 'Invalid username or password'}
		const success = await argon2.verify(rows[0].hash, pwd + process.env.SALT)
		let res = {success: success}
		if(success)
			sess.user = id
		else
			res.reason = 'Invalid username or password'
		return res
	} catch(e) {
		return {success: false, reason: e.message}
	}
}

//TODO: logout from all user sessions

exports.new_user = function(req, res) {
	console.log("Creating user " + req.body.id)
	// TODO: sanitize input
	create(req.body, req.session)
		.then((out) => res.json(out))
		.catch((e) => res.status(500).json(e))
}

exports.get_user = function(req, res) {
	login(req.body.username, req.body.password, req.session)
		.then((out) => res.json(out))
		.catch((e) => res.status(500).json(e))
}

//logout from current session
exports.logout = function(req, res) {
	delete req.session.user
		return res.json({success: true})
}