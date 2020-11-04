const express = require('express'),
		app = express(),
		path = require('path'),
		bodyParser = require('body-parser'),
		pg = require('pg'),
		session = require('express-session'),
		pgSession = require('connect-pg-simple')(session)

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

if (process.env.NODE_ENV === 'production') {
	app.set('trust proxy', 1)
	app.use((req, res, next) => {
		if (req.headers['x-forwarded-proto'] != 'https')
			res.redirect(301, 'https://' + req.hostname + req.originalUrl)
		else
			next()
	})
}
else
	process.env = require('dotenv-safe').load().parsed

const db = require('./api/controllers/db.js')
const sessionMiddleware = session({
	cookie: {
		httpOnly: true,
		maxAge: parseInt(process.env.SESSION_LIFESPAN),
		sameSite: 'strict',
		secure: (process.env.NODE_ENV === 'production')
	},
	resave: false,
	saveUninitialized: false,
	secret: process.env.COOKIE_SECRET,
	store: new pgSession({
		pool: new pg.Pool({
			connectionString: process.env.DATABASE_URL,
			// Allow certificates signed from CAs outside of pre-authorized list
			ssl: {
				sslmode: 'require',
				rejectUnauthorized: false
			}
		}),
		createTableIfMissing: true
		// errorLog:
	})
})
app.use(sessionMiddleware)

const routes = require('./api/routes/routes.js');
routes(app)
app.use(express.static(__dirname + '/public'));

const server = require('http').Server(app)
const peerServer = require('peer').ExpressPeerServer(server, {
	proxied: true,
	debug: true
})
app.use('/peer', peerServer)

const port = process.env.PORT || 3000
server.listen(port)
console.log("working on " + port)
