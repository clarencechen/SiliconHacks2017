//Initializes Chatbox
function setUpChatbox(conn) {
	// Register connection in connections list.
	const peerid = conn.peer
	// Take down chatbox for former participant.
	conn.on('close', () => {
		disableCallFeatures(peerid)
		disableChatFeatures(peerid)
	})
	// Receive chat message from a peer.
	conn.on('data', receiveChat)
	// Send a chat message to all active connections.
	$('#send').on('click', (e) => {
		e.preventDefault()
		// For each active connection, send the message.
		const msg = $('#text').val()
		if(msg) 
			sendChat(conn, msg)
	})
	// Call a peer.
	$('#call').on('click.call', (e) => {call(peerid)})
	// Receive call from a peer.
	peer.on('call', answer)
	enableChatFeatures(conn)
}

function enableChatFeatures(conn) {
	$('#connect').prop('disabled', false).text('Close Connection').addClass('is-danger')
	$('#connect').off('click.connect').on('click.close', (e) => {conn.close()})

	$('#text').prop('disabled', false)
	$('#send').prop('disabled', false).val('Send Message')
	$('#call').prop('disabled', false).text('Video Call')

	let message = $('<div><em>' + conn.peer + ' has joined the chat.</em></div>').addClass('important')
	$('#chatbox').append(message)
}

function disableChatFeatures(peerid) {
	var message;
	if(peerid)
		message = $('<div><em>' + peerid + ' has left the chat.</em></div>').addClass('important')
	else
		message = $('<div><em>Your chat client has been disconnected.</em></div>').addClass('important')
	$('#chatbox').append(message)		

	$('#call').off('click').prop('disabled', true).text('Connect Before Calling')
	$('#send').off('click').prop('disabled', true).val('Connect Before Messaging')
	$('#text').prop('disabled', true)

	const connectText = peerid ? 'Connect' : 'Please Refresh to Reconnect'
	$('#connect').prop('disabled', !peerid).text(connectText).removeClass('is-danger')
	$('#connect').off('click.close')
	if (peerid)
		$('#connect').on('click.connect', (e) => {findmatch()})
}

function sendChat(conn, msg) {
	conn.send({
		id : conn.peer,
		text : msg,
		lang : window.localStorage.language
	})
	$('#chatbox').append('<div><span class="you">You: </span>' + msg + '</div>')
	$('#text').val('').focus()
}

function receiveChat(data) {
	$('#chatbox').append('<div><p><span class="peer">' + data.id + ': </span>' + data.text + '</p>')
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