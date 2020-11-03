mediapromise = null

function display(remote) {
	const video = document.querySelector('video')
	video.srcObject = remote
	video.onloadedmetadata = (e) => {video.play()}
}

function call(peerid) {
	mediapromise = mediapromise || navigator.mediaDevices.getUserMedia({audio : true, video : true})
	mediapromise.then((stream) => {
		stream.getVideoTracks()[0].enabled = !$('#novideo').checked
		stream.getAudioTracks()[0].enabled = !$('#mute').checked
		// Initiate media call with our MediaStream
		$('#call').prop('disabled', true)
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
		call.on('stream', display)
	}).catch(mediaError)
}

function answer(call) {
	mediapromise = mediapromise || navigator.mediaDevices.getUserMedia({audio : true, video : true})
	mediapromise.then((stream) => {
		stream.getVideoTracks()[0].enabled = !$('#novideo').checked
		stream.getAudioTracks()[0].enabled = !$('#mute').checked
		call.answer(stream)
		setCallControls(call, stream)
		call.on('stream', display)
	}).catch(mediaError)
}

function hangup(abnormal) {
	const video = document.querySelector('video')
	video.pause()
	delete video.srcObject
	$('#call').on('click', (e) => {sendToActive(call, [])})
	const callText = abnormal ? "Call Failed, Click to Retry" : "Video Call"
	$('#call').text(callText)
}

function mediaError(err) {
	mediapromise = null
	$('#call').prop('disabled', true)
	$('#call').text("Please allow camera and microphone permissions if you want to call your match.")
}

function setCallControls(call) {
	call.on('err', (err) => {console.error(err);hangup(true)})
	call.on('close', () => {hangup(false)})
	$('#novideo').change((e) => {stream.getVideoTracks()[0].enabled = !this.checked})
	$('#mute').change((e) => {stream.getAudioTracks()[0].enabled = !this.checked})
	$('#chatbox').append(
		'<div><span class="you">You: </span>Started a call with ' + call.peer + '</div>')
	$('#call').on('click', (e) => {call.close();hangup(false)})
	$('#call').text('End Call')
	$('#call').removeProp('disabled')
}