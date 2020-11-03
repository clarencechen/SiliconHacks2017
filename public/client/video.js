mediapromise = null

function display(remote) {
	var video = document.querySelector('video')
	video.srcObject = remote
	video.onloadedmetadata = (e) => {video.play()}
}

function call(peerid, $c) {
	mediapromise = navigator.mediaDevices.getUserMedia({audio : true, video : true})
	if(mediapromise !== null) {
		console.log("Currently in call, please hang up before making another call.")
		return
	}
	mediapromise.then((stream) => {
		stream.getVideoTracks()[0].enabled = !$('#novideo').checked
		stream.getAudioTracks()[0].enabled = !$('#mute').checked
		// Initiate media call with our MediaStream
		$('#call').prop('disabled', 'disabled')
		$('#call').text("Connecting to peer...")
		var call = peer.call(peerid, stream)
		// Set timeout in case peer does not answer
		window.setTimeout(() => {
			if(!call.open) {
				call.close()
				hangup(true)
			}
		}, 10000)
		setCallControls(call)
		call.on('stream', (remote) => {
			$c.find('.messages').append(
				'<div><span class="you">You: </span>Started a call with ' + peerid + '</div>')
			$('#call').text('End Call')
			$('#call').removeProp('disabled')
			display(remote)
		})
	}).catch(mediaError)
}

function answer(call) {
	if(mediapromise === null) {
		mediapromise = navigator.mediaDevices.getUserMedia({audio : true, video : true})
	}
	mediapromise.then((stream) => {
		stream.getVideoTracks()[0].enabled = !$('#novideo').checked
		stream.getAudioTracks()[0].enabled = !$('#mute').checked
		call.answer(stream)
		setCallControls(call)
		call.on('stream', display)
		$('#call').text('End call')
		$('#call').removeProp('disabled')
	}).catch(mediaError)
}

function hangup(abnormal) {
	mediapromise = null
	$('#call').on('click', (e) => {sendToActive(call)})
	const callText = abnormal ? "Call Failed, Click to Retry" : "Video Call"
	$('#call').text(callText)
}

function mediaError(err) {
	mediapromise = null
	$('#call').prop('disabled', 'disabled')
	$('#call').text("Please allow camera and microphone permissions if you want to call your match.")
}

function setCallControls(call) {
	call.on('err', (err) => {console.error(err);hangup(true)})
	$('#call').on('click', (e) => {call.close();hangup(false)})
	call.on('close', () => {hangup(false)})
	$('#novideo').change((e) => {stream.getVideoTracks()[0].enabled = !this.checked})
	$('#mute').change((e) => {stream.getAudioTracks()[0].enabled = !this.checked})
}