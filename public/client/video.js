mediapromise = null

function display(remote) {
	const video = document.querySelector('video')
	video.srcObject = remote
	video.onloadedmetadata = (e) => {video.play()}
}

function call(peerid) {
	mediapromise = mediapromise || navigator.mediaDevices.getUserMedia({audio : true, video : true})
	mediapromise.then((stream) => {
		enableStreamFeatures(stream)
		// Initiate media call with our MediaStream
		$('#call').prop('disabled', true).text("Connecting to peer...")
		var call = peer.call(peerid, stream)
		// Set timeout in case peer does not answer
		window.setTimeout(() => {
			if(!call.open)
				call.close()
		}, 10000)
		// Handle errors during call.
		call.on('err', (err) => {
			console.error(err)
			call.close()
		})
		// Cleanup on closure
		call.on('close', () => {
			document.querySelector('video').pause()
			delete stream
			disableCallFeatures(call.peer)
		})
		// Display stream when received.
		call.on('stream', display)
		enableCallFeatures(call, stream)
		let message = $('<div><em>You called ' + call.peer + '.</em></div>').addClass('important')
		$('#chatbox').append(message)
	}).catch(mediaError)
}

function answer(call) {
	mediapromise = mediapromise || navigator.mediaDevices.getUserMedia({audio : true, video : true})
	mediapromise.then((stream) => {
		enableStreamFeatures(stream)
		call.answer(stream)
		// Handle errors during call.
		call.on('err', (err) => {
			console.error(err)
			call.close()
		})
		// Cleanup on closure
		call.on('close', () => {
			document.querySelector('video').pause()
			delete stream
			disableCallFeatures(call.peer)
		})
		// Display stream when received.
		call.on('stream', display)
		enableCallFeatures(call, stream)
		let message = $('<div><em>' + call.peer + ' called you.</em></div>').addClass('important')
		$('#chatbox').append(message)
	}).catch(mediaError)
}

function disableCallFeatures(peerid) {
	let message = $('<div><em>Your call with ' + peerid + ' has ended.</em></div>').addClass('important')
	$('#chatbox').append(message)
	$('#call').text("Call Ended, Click to Restart").removeClass('is-danger')
	$('#call').off('click.hangup').on('click.call', (e) => {call(peerid)})
}

function mediaError(err) {
	mediapromise = null
	$('#call').prop('disabled', true).addClass('is-danger')
	$('#call').text("Please allow camera and microphone permissions if you want to call your match.")
}

function enableCallFeatures(call, stream) {
	$('#call').prop('disabled', false).text('End Call').addClass('is-danger')
	$('#call').off('click.call').on('click.hangup', (e) => {call.close()})
}

function enableStreamFeatures(stream) {
	stream.getVideoTracks()[0].enabled = !$('#novideo').checked
	stream.getAudioTracks()[0].volume = $('#volume').val
	stream.getAudioTracks()[0].enabled = !$('#mute').checked
	$('#novideo').on('input', (e) => {stream.getVideoTracks()[0].enabled = !this.checked})
	$('#volume').on('input', (e) => {stream.getAudioTracks()[0].volume = this.val / 100})
	$('#mute').on('input', (e) => {stream.getAudioTracks()[0].enabled = !this.checked})
}