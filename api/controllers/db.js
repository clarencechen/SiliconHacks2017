process.env = require('dotenv-safe').load().parsed;

const pg = require('pg')

const pool = new pg.Pool({
	connectionString: process.env.DATABASE_URL,
	// Allow certificates signed from CAs outside of pre-authorized list
	ssl: {rejectUnauthorized: false}
})

module.exports = {
	query: (text, params) => pool.query(text, params)
}