var socket = io()
let connectedPeers = {}
const ethArr = [
	'Black', 'East or Southeast Asian',
	'European', 'South Asian',
	'Middle Eastern or North African',
	'Native American/First Nations',
	'Other'
]

function shutdown() {
	disableFeatures()
	if (peer)
		peer.destroy()
	if (socket)
		socket.close()
}

$(document).ready(function() {
	//populate user bio
	$.ajax({
		type: 'POST',
		url: 'https://cit-i-zen.herokuapp.com:443/client/info',
		data: {},
		success: (res) => {
			window.localStorage.setItem('language', res.lang)
			const ethString = ethArr.filter((i, e) => res.ethnicity & (1 << i)).join(', ')
			$('#name').text(res.username)
			$('#language').text(res.lang)
			$('#gender').text(res.gender)
			$('#age').text(res.age)
			$('#religion').text(res.religion)
			$('#orientation').text(res.orientation)
			$('#ethnicity').text(ethString)
		},
		error: (err) => {console.log(JSON.stringify(err))}
	})
	//open a chat connection
	$('#connect').on('click', (e) => {
		disableFeatures()
		$('#connect').prop('disabled', true)
		console.log('opening connection')
		socket.open()
		findmatch()
		// Await connections from others
		socket.on('invite', (data) => {socket.emit('accept', {room : data.room})})
		// Set up chatbox for new chat participant.
		socket.on('joined', setUpChatbox)
		// Take down chatbox for former participant.
		socket.on('kill', disconnectChat)
		// Receive call from a peer.
		socket.on('call', answer)
		// Close connections.
		$('#close').on('click', (e) => {shutdown()})
		// Call a peer.
		$('#call').on('click', (e) => {eachActiveConnection(connectForCall)})
		// Send a chat message to all active connections.
		$('#send').on('click', (e) => {
			e.preventDefault()
			// For each active connection, send the message.
			const msg = $('#text').val()
			if(msg) {
				eachActiveConnection((peerId, $c) => {
					socket.emit('chat', {
						id : socket.id,
						text : msg,
						lang : window.localStorage.language
					})
					$c.find('.messages').append(
						'<div><span class="you">You: </span>' + msg + '</div>')
				})
				$('#text').val('')
				$('#text').focus()
			}
		})
		$('.connection').on('click', () => {
			if ($(this).attr('class').indexOf('active') === -1)
				$(this).addClass('active')
			else
				$(this).removeClass('active')
		})
	})
	// Goes through each active peer and calls FN on its connections.
	function eachActiveConnection(fn) {
		const actives = $('.active')
		let checkedIds = {}
		actives.each(() => {
			var peerId = $(this).attr('id')
			if (!checkedIds[peerId]) {
				if(connectedPeers[peerId])
					fn(peerId, $(this));
			}
			checkedIds[peerId] = true;
		})
	}
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

//Initializes Chatbox
function setUpChatbox(target) {
	connectedPeers[target] = true
	let chatbox = $('#chatbox').addClass('connection').addClass('active').attr('id', target)
	let message = $('<div><em>' + target + ' has joined the room.</em></div>').addClass('messages')
	chatbox.append(message)
	enableFeatures()
}

function disconnectChat(data) {
	let message = $('<div><em>' + data + ' has left the room.</em></div>').addClass('messages')
	$('#chatbox').append(message)
	$('.connection').filter((i, e) => ($(e).attr('id') === data)).remove()
	connectedPeers[data] = false
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

function findmatch() {
	$.ajax({
		type: 'POST',
		url: 'https://cit-i-zen.herokuapp.com:443/client/match',
		data: {socket: socket.id},
		success: (match) => {
			console.log('matched with ' + match.id)
			if (!connectedPeers[match.id])
				socket.emit('room', {id : match.id})
		},
		error: (err) => {
			console.log(JSON.stringify(err))
			if(err.status == '500')
				$('#connect').text('Could not connect to server')
			else if(err.status == '202')
				$('#connect').text('Please wait for a match')
		}
	})
}

socket.on('chat', (data) => {
	$('.messages').append(
		'<div><p><span>' + data.id + ':</span> ' + data.text + '</p>')
	if(window.localStorage.language !== data.lang) {
		$.ajax({
			type: 'POST',
			url: 'https://cit-i-zen.herokuapp.com:443/client/translate',
			data: {
				text: data.text,
				target: window.localStorage.language,
				source: data.lang
			},
			success: (data) => {
				if(data.error)
					$('.messages').append('<p>' + JSON.stringify(data.error) + '</p></div>')
				else
					$('.messages').append('<p>' + data + '</p></div>')
			},
			error: (err) => {
				console.log(JSON.stringify(err))
				$('.messages').append('<p>' + JSON.stringify(JSON.stringify(err)) + '</p></div>')
			}
		})
	} else {
		$('.messages').append('</div>')
	}
})

socket.on('disconnect', (data) => {
	$('.connection').empty()
	for(var a in connectedPeers)
		connectedPeers[a] = false
	disableFeatures()
	mediapromise = null
})

socket.on('error', (err) => {
	console.log(JSON.stringify(err))
	shutdown()
})

// Make sure things clean up properly.
window.onunload = window.onbeforeunload = (e) => {shutdown()}