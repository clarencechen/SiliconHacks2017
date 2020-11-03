const peer = new Peer({
	host: '/',
	port: '',
	path: '/peer',
	secure: true,
	debug: 1,
	logFunction: peerLog
})

let connections = {}

const ethArr = [
	'Black', 'East or Southeast Asian',
	'European', 'South Asian',
	'Middle Eastern or North African',
	'Native American/First Nations',
	'Other'
]

function enableFeatures() {
	$('#connect').prop('disabled', true).text('Connection Found')
	$('#close').removeProp('disabled').text('Close Connection') 
	$('#text').removeProp('disabled')
	$('#send').removeProp('disabled').val('Send Message')
	$('#call').removeProp('disabled').text('Video Call')
}

function disableFeatures() {
	$('#call').prop('disabled', true).text('Connect Before Calling')
	$('#send').prop('disabled', true).val('Connect Before Messaging')
	$('#text').prop('disabled', true)
	$('#close').prop('disabled', true).text('No Connections to Close') 
	$('#connect').removeProp('disabled').text('Connect')
}

function shutdown() {
	disableFeatures()
	Object.keys(connections).forEach((id) => {
		if (connections[id].open)
			connections[id].close()
	})
	connections = {}
	peer.destroy()
	$('#connect').prop('disabled', true).text('Please Refresh to Reconnect')
}

function fatalError(err) {
	console.error(err)
	shutdown()
}

function peerLog() {
	var copy = Array.prototype.slice.call(arguments).join(' ')
	$('.log').append(copy + '<br>')
}

function findmatch() {
	$('#connect').prop('disabled', true)
	console.log('looking for match')
	$.ajax({
		type: 'POST',
		url: 'https://cit-i-zen.herokuapp.com:443/client/match',
		data: {socket: peer.id},
		success: (match) => {
			if (!match.id)
				$('#connect').text('Please wait for a match')
			else {
				console.log('matched with ' + match.id)
				if (!connections[match.id]) {
					const conn = peer.connect(match.id)
					conn.on('open', () => setUpChatbox(conn))
					conn.on('error', fatalError)
				}
			}
		},
		error: (err) => {
			console.error(err)
			$('#connect').text('Could not connect to server')
		}
	})
}

$(document).ready(function() {
	//populate user bio
	$.ajax({
		type: 'POST',
		url: 'https://cit-i-zen.herokuapp.com:443/client/info',
		data: {},
		success: (res) => {
			window.localStorage.setItem('language', res.lang)
			const ethString = ethArr.filter((e, i) => parseInt(res.ethnicity) & (1 << i)).join(', ')
			$('#name').text(res.username)
			$('#language').text(res.lang)
			$('#gender').text(res.gender)
			$('#age').text(res.age)
			$('#religion').text(res.religion)
			$('#orientation').text(res.orientation)
			$('#ethnicity').text(ethString)
		},
		error: console.error
	})
	// Set up chatbox for new chat participant.
	peer.on('connection', (conn) => {
		if (!connections[conn.peer]) {
			conn.on('open', () => setUpChatbox(conn))
			conn.on('error', fatalError)
		}
	})
	//open a chat connection
	$('#connect').on('click', (e) => {findmatch()})
})

peer.on('close', shutdown)
peer.on('error', fatalError)
peer.on('disconnected', peer.reconnect)

// Make sure things clean up properly.
window.onunload = window.onbeforeunload = (e) => {shutdown()}