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

function shutdown() {
	disableFeatures()
	Object.keys(connections).forEach((id) => {
		if (connections[id].open)
			connections[id].close()
	})
	delete connections
	mediapromise = null
	peer.destroy()
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
	disableFeatures()
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
					conn.on('open', setUpChatbox)
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
			const ethString = ethArr.filter((i, e) => parseInt(res.ethnicity) & (1 << i)).join(', ')
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
			conn.on('open', setUpChatbox)
			conn.on('error', fatalError)
		}
	})
	//open a chat connection
	$('#connect').on('click', (e) => {
		findmatch()
		$('.connection').on('click', () => {
			if ($(this).attr('class').indexOf('active') === -1)
				$(this).addClass('active')
			else
				$(this).removeClass('active')
		})
	})
})

function enableFeatures() {
	$('#connect').text('Connection Found')
	$('#connect').prop('disabled', true)
	$('#close').removeProp('disabled')
	$('#close').text('Close Connection') 
	$('#call').removeProp('disabled')
	$('#call').text('Videocall')
	$('#send').removeProp('disabled')
	$('#send').text('Send Message')
}

function disableFeatures() {
	$('#call').prop('disabled', true)
	$('#call').text('Connect First before calling')
	$('#send').prop('disabled', true)
	$('#send').text('Connect First before messaging')
	$('#close').prop('disabled', true)
	$('#close').text('No Connections to Close') 
	$('#connect').removeProp('disabled')
	$('#connect').text('Connect')
}

peer.on('close', shutdown)
peer.on('error', fatalError)
peer.on('disconnected', peer.reconnect)

// Make sure things clean up properly.
window.onunload = window.onbeforeunload = (e) => {shutdown()}