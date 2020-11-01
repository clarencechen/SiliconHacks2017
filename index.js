if (process.env.NODE_ENV !== 'production')
	process.env = require('dotenv-safe').load().parsed

const express = require('express'),
		app = express(),
		path = require('path'),
		bodyParser = require('body-parser'),
		pg = require('pg'),
		session = require('express-session'),
		pgSession = require('connect-pg-simple')(session)

const db = require('./api/controllers/db.js')
const sessionMiddleware = session({
	cookie: {
		httpOnly: true,
		maxAge: parseInt(process.env.SESSION_LIFESPAN),
		sameSite: 'strict',
		secure: true
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
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use(sessionMiddleware)

const routes = require('./api/routes/routes.js');
routes(app)
app.use(express.static(__dirname + '/public'));

const server = require('http').Server(app)
const io = require('socket.io')(server)
io.use((socket, next) => {
  sessionMiddleware(socket.request, {}, next)
})

const peerServer = require('peer').ExpressPeerServer(server, {debug: true})
app.use('/call', peerServer)

const port = process.env.PORT || 3000
server.listen(port)
console.log("working on " + port)

let counter = 0;
io.on('connection', function(client) {
	console.log(client.id + ' connected')
	client.on('chat', function(data){
		console.log(data)
		client.broadcast.to(client.request.session.room).emit('chat', data)
	});
	client.on('room', (data) => {
		console.log('client ' + client.id + ' created room ' + counter)
		client.join(counter)
		client.request.session.room = counter
		client.to(data.id).emit('invite', {room : counter})
		counter += 1
	})
	client.on('accept', (data) => {
		const roomnum = data.room
		console.log('client ' + client.id + ' joined room ' + roomnum)
		client.join(roomnum)
		client.request.session.room = roomnum
		client.broadcast.to(roomnum).emit('joined', client.id)
	})
	client.on('disconnect', () => {
		console.log(client.id + ' disconnected')
		//TODO: client may still be waiting for match when disconnected
		//if(client.request.session.room === undefined) {
		//}
		//else {
			client.broadcast.to(client.request.session.room).emit('kill', client.id)
			delete client.request.session.room
		//}
	})
	client.on('call', () => {
		console.log('client' + client.id + ' is calling')
		client.broadcast.to(client.request.session.room).emit('call')
	})
	client.on('answered', () => {
		console.log('client' + client.id + ' picked up')
		client.broadcast.to(client.request.session.room).emit('answered')
	})
})