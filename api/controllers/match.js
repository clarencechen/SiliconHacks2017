const db = require('./db.js')

const checkAttrs = "SELECT twitter, lang, demographics AS dmgs FROM users WHERE username=$1"

const findMatch = 'SELECT socket FROM queue WHERE demographics<>$1 ORDER BY insert_time ASC'
const insertMatch = `INSERT INTO
queue(demographics, socket, insert_time)
VALUES($1, $2, $3)`
const deleteMatch = "DELETE FROM queue WHERE socket=$1"

//request user info
async function info(username) {
	try {
		const { rows } = await db.query(checkAttrs, [username])
		let response = {
			'username': username,
			'twitter': rows[0].twitter,
			'lang': rows[0].lang
		}
		for(x in rows[0].dmgs) {
			response[x] = rows[0].dmgs[x]
		}
		return response
	} catch(e) {
		throw e
	}
}

async function match(username, socket) {
	try {
		const { rows } = await db.query(checkAttrs, [username])
		const { rows: matches } = await db.query(findMatch, [rows[0].dmgs])
		if(matches.length < 1) {
			const now = new Date().getTime()
			const r = await db.query(insertMatch, [rows[0].dmgs, socket, now])
			return {id: null}
		} else {
			const r = await db.query(deleteMatch, [matches[0].socket])
			return {id: matches[0].socket}
		}
	} catch(e) {
		throw e
	}
}

exports.user_info = function(req, res) {
	info(req.session.user)
		.then((out) => res.json(out))
		.catch((e) => res.status(500).json(e))
}

exports.match_text = function(req, res) {
	match(req.session.user, req.body.socket).then((out) => {
		if(out.id)
			return res.json(out)
		else {
			console.log('database waiting for match')
			return res.status(202).send('Wait for your match')
		}
	}).catch((e) => res.status(500).json(e))
}