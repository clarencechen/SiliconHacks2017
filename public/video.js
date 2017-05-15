var peer = null;
var mediapromise = null;

function display(remote) {
  var video = document.querySelector('video');
  video.srcObject = remote;
  video.onloadedmetadata = function(e) {video.play();}
}

function call(peerid) {
  if(mediapromise !== null)
  {
    console.log("already in call")
    return;
  }
  console.log("prepare for call")
  mediapromise = navigator.mediaDevices.getUserMedia({audio : true, video : true});
  mediapromise.then(function(stream) {
    stream.getVideoTracks()[0].enabled = !$('#novideo').checked;
    stream.getAudioTracks()[0].enabled = !$('#mute').checked;
    peer = new Peer(socket.id, {
      // Set API key for cloud server (you don't need this if you're running your
      // own.
      host: '/',
      port: '',
      path: '/call',
      // Set highest debug level (log everything!).
      debug: 1,

      // Set a logging function:
      logFunction: function() {
        var copy = Array.prototype.slice.call(arguments).join(' ');
        $('.log').append(copy + '<br>');
      }
    });
    $('#call').prop('disabled', 'disabled')
    $('#call').text("calling...")
    socket.emit('call');
    socket.on('answered', function(){
      actuallycall(peerid, stream);
    })
  }).catch(function(err){
      console.log(err.name + ": " + err.message);
      $('#call').prop('disabled', 'disabled')
      $('#call').text("can't call")
  })
}

function actuallycall(peerid, stream){
  var call = peer.call(peerid, stream);
  call.on('err', function(err) {
    console.log(err);
    $('#call').prop('disabled', 'disabled')
    $('#call').text("can't call")
  })
  call.on('stream', function(remote) {
      $('#call').text('end call')
      $('#call').removeProp('disabled');
      display(remote);
  })
  $('body').on('click', '#call', function(e) {
    call.close()
  })
  call.on('close', function() {
    $('#call').text("call ended")
    $('#call').prop('disabled', 'disabled')
    mediapromise = null
  })
  $('#novideo').change(function(e) {
    stream.getVideoTracks()[0].enabled = !this.checked;
  })
  $('#mute').change(function(e) {
    stream.getAudioTracks()[0].enabled = !this.checked;
  })
  setTimeout(function() {
    if(!call.open)
    {
      $('#call').prop('disabled', 'disabled')
      $('#call').text("didnt pick up")
    }
  }, 100000)
}

function answer() {
  peer = new Peer(socket.id, {
  // Set API key for cloud server (you don't need this if you're running your
  // own.
  host: '/',
  port: '',
  path: '/call',
  // Set highest debug level (log everything!).
  debug: 1,

  // Set a logging function:
  logFunction: function() {
    var copy = Array.prototype.slice.call(arguments).join(' ');
    $('.log').append(copy + '<br>');
  }
  });
  $('#call').prop('disabled', 'disabled')
  $('#call').text("answering call...")
  socket.emit('answered')
  peer.on('call', pickup)
}
function pickup(call) {
  console.log('receiving call')
  mediapromise = navigator.mediaDevices.getUserMedia({audio : true, video : true});
  mediapromise.then(function(stream) {
    stream.getVideoTracks()[0].enabled = !$('#novideo').checked;
    stream.getAudioTracks()[0].enabled = !$('#mute').checked;
    // Answer the call, providing our MediaStream
    call.answer(stream);
    $('#call').text('end call');
    $('#call').removeProp('disabled');
    call.on('stream', function(remote) {
    // `stream` is the MediaStream of the remote peer.
    // Here you'd add it to an HTML video/canvas element.
      display(remote);
    })
    $('body').on('click', '#call', function(e) {
      call.close()
    })
    call.on('close', function() {
      $('#call').text("call ended")
      $('#call').prop('disabled', 'disabled')
      mediapromise = null
    })
    $('#novideo').change(function(e) {
      stream.getVideoTracks()[0].enabled = !this.checked;
    })
    $('#mute').change(function(e) {
      stream.getAudioTracks()[0].enabled = !this.checked;
    })
  })
}
