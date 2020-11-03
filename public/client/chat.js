//Initializes Chatbox
function setUpChatbox(conn) {
	// Register connection in connections list.
	connections[conn.peer] = conn
	// Take down chatbox for former participant.
	conn.on('close', () => {disconnectChat(conn.peer)})
	// Close connection.
	$('#close').on('click', (e) => {shutdown()})
	// Receive chat message from a peer.
	conn.on('data', receiveChat)
	// Send a chat message to all active connections.
	$('#send').on('click', (e) => {
		e.preventDefault()
		// For each active connection, send the message.
		const msg = $('#text').val()
		if(msg) 
			sendToActive(sendChat, [msg])
	})
	// Call a peer.
	$('#call').on('click', (e) => {sendToActive(call, [])})
	// Receive call from a peer.
	peer.on('call', answer)

	let chatbox = $('#chatbox').addClass('connection').addClass('active').attr('id', conn.peer)
	let message = $('<div><em>' + conn.peer + ' has joined the room.</em></div>').addClass('messages')
	chatbox.append(message)
	enableFeatures()
}

function disconnectChat(peerid) {
	let message = $('<div><em>' + peerid + ' has left the room.</em></div>').addClass('messages')
	$('#chatbox').append(message)
	$('.connection').filter((i, e) => ($(e).attr('id') === peerid)).remove()
	delete connections[peerid]
}

function sendChat(peerid, $c, msg) {
	connections[peerid].send({
		id : peerid,
		text : msg,
		lang : window.localStorage.language
	})
	$c.find('.messages').append('<div><span class="you">You: </span>' + msg + '</div>')
	$('#text').val('')
	$('#text').focus()
}

function receiveChat(data) {
	$('.messages').append('<div><p><span>' + data.id + ': </span>' + data.text + '</p>')
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
				const header = data.error ? 'Translation Error: ' : 'Translated: '
				const translation = data.error ? JSON.stringify(data.error) : data
				$('.messages').append('<p>' + header + translation + '</p></div>')
			},
			error: (err) => {
				$('.messages').append('<p>Translation Error: ' + JSON.stringify(JSON.stringify(err)) + '</p></div>')
			}
		})
	} else {
		$('.messages').append('</div>')
	}
}

// Goes through each active peer and calls fn on its active connections with the array args.
function sendToActive(fn, args) {
	let checkedIds = {}
	$('.active').each(() => {
		let peerid = $(this).attr('id')
		if (!checkedIds[peerid] && connections[peerid])
			fn(peerid, $(this), ...args)
		checkedIds[peerid] = true
	})
}