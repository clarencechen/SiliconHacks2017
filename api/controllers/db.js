const pg = require('pg')

const pool = new pg.Pool({
	connectionString: process.env.DATABASE_URL + '?sslmode=require',
	// Allow certificates signed from CAs outside of pre-authorized list
	ssl: {rejectUnauthorized: false}
})

module.exports = {
	query: (text, params) => pool.query(text, params)
}