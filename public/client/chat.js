//Initializes Chatbox
function setUpChatbox(conn) {
	// Register connection in connections list.
	const peerid = conn.peer
	connections[peerid] = conn
	// Take down chatbox for former participant.
	conn.on('close', () => {disconnectChat(peerid)})
	// Close connection.
	$('#close').on('click', (e) => {
		disableFeatures()
		conn.close()
		connections = {}
	})
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
	// Toggle active contacts
	$('.connection').on('click', () => {
		if ($(this).attr('class').indexOf('active') === -1)
			$(this).addClass('active')
		else
			$(this).removeClass('active')
	})
	
	let chatbox = $('#chatbox').addClass('connection').addClass('active').attr('peer', peerid)
	let message = $('<div><em>' + peerid + ' has joined the chat.</em></div>').addClass('messages')
	chatbox.append(message)
	enableFeatures()
}

function disconnectChat(peerid) {
	$('#chatbox').append('<div><em>' + peerid + ' has left the chat.</em></div>')
	$('.connection').filter((e, i) => ($(e).attr('peer') === peerid)).remove()
	delete connections[peerid]
}

function sendChat(peerid, msg) {
	connections[peerid].send({
		id : peerid,
		text : msg,
		lang : window.localStorage.language
	})
	$('#chatbox').append('<div><span class="you">You: </span>' + msg + '</div>')
	$('#text').val('').focus()
}

function receiveChat(data) {
	$('#chatbox').append('<div><p><span>' + data.id + ': </span>' + data.text + '</p>')
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
				$('#chatbox').append('<p>' + header + translation + '</p></div>')
			},
			error: (err) => {
				$('#chatbox').append('<p>Translation Error: ' + JSON.stringify(JSON.stringify(err)) + '</p></div>')
			}
		})
	} else {
		$('#chatbox').append('</div>')
	}
}

// Goes through each active peer and calls fn on its active connections with the array args.
function sendToActive(fn, args) {
	let checkedIds = {}
	$('.active').each((i, e) => {
		let peerid = $(e).attr('peer')
		if (!checkedIds[peerid] && connections[peerid])
			fn(peerid, ...args)
		checkedIds[peerid] = true
	})
}