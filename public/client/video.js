mediapromise = null

function display(local, remote) {
	const remoteFeed = $('#remotefeed')[0],
		localFeed =  $('#localfeed')[0]
	remoteFeed.srcObject = remote
	localFeed.srcObject = new MediaStream([local.getVideoTracks()[0]])

	remote.getAudioTracks()[0].enabled = !$('#mute')[0].checked
	remote.getAudioTracks()[0].volume = $('#volume')[0].value / 100
	local.getAudioTracks()[0].enabled = !$('#noaudio')[0].checked
	local.getVideoTracks()[0].enabled = !$('#novideo')[0].checked

	$('#volume').on('input', (e) => {remote.getAudioTracks()[0].volume = e.target.value / 100})
	$('#mute').on('input', (e) => {remote.getAudioTracks()[0].enabled = !(e.target.checked)})
	$('#noaudio').on('input', (e) => {local.getAudioTracks()[0].enabled = !(e.target.checked)})
	$('#novideo').on('input', (e) => {local.getVideoTracks()[0].enabled = !(e.target.checked)})
	remoteFeed.onloadedmetadata = (e) => {remoteFeed.play()}
	localFeed.onloadedmetadata = (e) => {localFeed.play()}
}


function call(peerid) {
	mediapromise = mediapromise || navigator.mediaDevices.getUserMedia({audio : true, video : true})
	mediapromise.then((stream) => {
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
		call.on('close', () => {disableCallFeatures(call.peer)})
		// Display stream when received.
		call.on('stream', (remote) => {display(stream, remote)})
		enableCallFeatures(call, stream)
		let message = $('<div><em>You called ' + call.peer + '.</em></div>').addClass('important')
		$('#chatbox').append(message)
	}).catch(mediaError)
}

function answer(call) {
	mediapromise = mediapromise || navigator.mediaDevices.getUserMedia({audio : true, video : true})
	mediapromise.then((stream) => {
		// 
		call.answer(stream)
		// Handle errors during call.
		call.on('err', (err) => {
			console.error(err)
			call.close()
		})
		// Cleanup on closure
		call.on('close', () => {disableCallFeatures(call.peer)})
		// Display stream when received.
		call.on('stream', (remote) => {display(stream, remote)})
		enableCallFeatures(call, stream)
		let message = $('<div><em>' + call.peer + ' called you.</em></div>').addClass('important')
		$('#chatbox').append(message)
	}).catch(mediaError)
}

function disableCallFeatures(peerid) {
	const video = document.querySelector('video')
	video.pause()
	video.srcObject = null
	$('.videocontrol').off('input')

	let message = $('<div><em>Your call with ' + peerid + ' has ended.</em></div>').addClass('important')
	$('#chatbox').append(message)
	$('#call').text("Call Ended, Click to Restart").removeClass('is-danger')
	$('#call').off('click.hangup').on('click.call', (e) => {call(peerid)})
}

function mediaError(err) {
	mediapromise = null
	$('#call').prop('disabled', true).addClass('is-danger')
	$('#call').text("Camera and microphone permissions denied.")
}

function enableCallFeatures(call, stream) {
	$('#call').prop('disabled', false).text('End Call').addClass('is-danger')
	$('#call').off('click.call').on('click.hangup', (e) => {call.close()})
}