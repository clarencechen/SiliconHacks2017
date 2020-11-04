const peer = new Peer({
	host: '/',
	port: '',
	path: '/peer',
	secure: true,
	debug: 1,
	logFunction: peerLog
})
const ethArr = [
	'Black', 'East or Southeast Asian',
	'European', 'South Asian',
	'Middle Eastern or North African',
	'Native American/First Nations',
	'Other'
]
function shutdown() {
	disableChatFeatures(null)
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
				const conn = peer.connect(match.id)
				conn.on('open', () => setUpChatbox(conn))
				conn.on('error', fatalError)
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
		conn.on('open', () => setUpChatbox(conn))
		conn.on('error', (err) => {
			conn.close()
			fatalError(err)
		})
	})
	//open a chat connection
	$('#connect').on('click.connect', (e) => {findmatch()})
	$('#logout').on('click', (e) => {
		$.ajax({
			type: 'POST',
			url: 'https://cit-i-zen.herokuapp.com:443/logout',
			data: {},
			success: (res) => {
				shutdown()
				window.location.replace("/")
			},
			error: console.error
		})
	})
})

peer.on('close', shutdown)
peer.on('error', fatalError)
peer.on('disconnected', peer.reconnect)

// Make sure things clean up properly.
window.onunload = window.onbeforeunload = (e) => {shutdown()}