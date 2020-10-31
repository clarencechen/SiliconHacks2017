var peer = null
var mediapromise = null

function display(remote) {
	var video = document.querySelector('video')
	video.srcObject = remote
	video.onloadedmetadata = (e) => {video.play()}
}

function peerLog() {
	var copy = Array.prototype.slice.call(arguments).join(' ')
	$('.log').append(copy + '<br>')
}

function connectForCall(peerid) {
	if(mediapromise !== null) {
		console.log("already in call")
		return
	}
	peer = new Peer(socket.id, {
		host: '/',
		port: '',
		path: '/call',
		debug: 1,
		logFunction: peerLog
	})
	mediapromise = navigator.mediaDevices.getUserMedia({audio : true, video : true})
	mediapromise.then((stream) => {
		stream.getVideoTracks()[0].enabled = !$('#novideo').checked
		stream.getAudioTracks()[0].enabled = !$('#mute').checked
		// Initiate media call with our MediaStream
		$('#call').prop('disabled', 'disabled')
		$('#call').text("Connecting to peer...")
		socket.emit('call')
		// Initiate media call with our MediaStream
		socket.on('answered', () => {call(peerid, stream)})
		socket.on('failed', mediaError)
	}).catch(mediaError)
}

function answer() {
	if(mediapromise !== null) {
		console.log("already in call")
		return
	}
	peer = new Peer(socket.id, {
		host: '/',
		port: '',
		path: '/call',
		debug: 1,
		logFunction: peerLog
	})
	mediapromise = navigator.mediaDevices.getUserMedia({audio : true, video : true})
	mediapromise.then((stream) => {
		stream.getVideoTracks()[0].enabled = !$('#novideo').checked
		stream.getAudioTracks()[0].enabled = !$('#mute').checked

		$('#call').prop('disabled', 'disabled')
		$('#call').text("Waiting for call from peer...")
		socket.emit('answered')
		// Answer the call, providing our MediaStream
		peer.on('call', (call) => pickup(call, stream))
	}).catch((err) => {
		mediaError(err)
		socket.emit('failed', {name : 'PeerMediaError', message : 'Your peer encountered a media error.'})
	})
}

function call(peerid, stream) {
	var call = peer.call(peerid, stream)
	setCallControls(call)
	call.on('stream', (remote) => {
		$('#call').text('End Call')
		$('#call').removeProp('disabled')
		display(remote)
	})
}

function pickup(call, stream) {
	call.answer(stream)
	setCallControls(call)
	call.on('stream', display)
	$('#call').text('End call')
	$('#call').removeProp('disabled')
}

function hangup() {
	mediapromise = null
	$('#call').prop('disabled', 'disabled')
	$('#call').text("Call ended")
}

function callError(err){
	mediapromise = null
	console.log(err)
	$('#call').prop('disabled', 'disabled')
	$('#call').text("Call failed")
}

function mediaError(err) {
	mediapromise = null
	peer.destroy()
	console.log(err.name + ": " + err.message)
	$('#call').prop('disabled', 'disabled')
	$('#call').text("Couldn't connect to peer")
}

function setCallControls(call) {
	call.on('err', callError)
	$('body').on('click', '#call', (e) => {call.close()})
	call.on('close', hangup)
	$('#novideo').change((e) => {stream.getVideoTracks()[0].enabled = !this.checked})
	$('#mute').change((e) => {stream.getAudioTracks()[0].enabled = !this.checked})
}