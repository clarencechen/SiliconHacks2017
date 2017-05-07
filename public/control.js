// https://github.com/peers/peerjs.git
var mediapromise = null;
var peer;
var g_id;
var connectedPeers = {};
// Connect to PeerJS, have server assign an ID instead of providing one
// Showing off some of the configs available with PeerJS :).

// Handle a connection object.
function connect(c) {
  // Handle a chat connection.
  if (c.label === 'chat') {
    console.log('new connection');

    var chatbox = $('<div></div>').addClass('connection').addClass('active').attr('id', c.peer);
    var header = $('<h1></h1>').html('Chat with <strong>' + c.peer + '</strong>');
    var messages = $('<div><em>Peer connected.</em></div>').addClass('messages');
    chatbox.append(header);
    chatbox.append(messages);
 
    // Select connection handler.
    chatbox.on('click', function() {
      if ($(this).attr('class').indexOf('active') === -1) {
        $(this).addClass('active');
      } else {
        $(this).removeClass('active');
      }
    });
    $('#connections').append(chatbox);
    // Call a Peer
    $('#call').click(function() {
      call(c.peer)
    })
    c.on('data', function(data) {
        console.log('Hi YDD');
      messages.append('<div><span class="peer">' + c.peer + '</span>: ' + data +
        '</div>');
    });
    c.on('close', function() {
        alert(c.peer + ' has left the chat.');
        chatbox.remove();
        if ($('.connection').length === 0) {

        }
        delete connectedPeers[c.peer];
    });
  } else if (c.label === 'file') {
    c.on('data', function(data) {
      // If we're getting a file, create a URL for it.
      if (data.constructor === ArrayBuffer) {
        var dataView = new Uint8Array(data);
        var dataBlob = new Blob([dataView]);
        var url = window.URL.createObjectURL(dataBlob);
        $('#' + c.peer).find('.messages').append('<div><span class="file">' +
            c.peer + ' has sent you a <a target="_blank" href="' + url + '">file</a>.</span></div>');
      }
    });
  }
  connectedPeers[c.peer] = 1;
}

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
    $('#call').attr('disabled', 'disabled')
    $('#call').text("calling...")
    var call = peer.call(peerid, stream);
    call.on('err', function(err) {
      console.log(err);
      $('#call').attr('disabled', 'disabled')
      $('#call').text("can't call")
    })
    call.on('stream', function(remote) {
      if($('#call').attr('disabled') == 'disabled')
      {
        $('#call').text('end call')
        $('#call').removeAttr('disabled')
      }
      display(remote);
    })
    $('body').on('click', '#call', function(e) {
      call.close()
    })
    call.on('close', function() {
      $('#call').text("call ended")
      $('#call').attr('disabled', 'disabled')
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
        $('#call').attr('disabled', 'disabled')
        $('#call').text("didnt pick up")
      }
    }, 10000)

  })
}

function answer(call) {
  console.log('receiving call')
  mediapromise = navigator.mediaDevices.getUserMedia({audio : true, video : true});
  mediapromise.then(function(stream) {
    stream.getVideoTracks()[0].enabled = !$('#novideo').checked;
    stream.getAudioTracks()[0].enabled = !$('#mute').checked;
    // Answer the call, providing our MediaStream
    call.answer(stream);
    $('#call').text('end call');
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
      $('#call').attr('disabled', 'disabled')
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

$(document).ready(function() {

  

  // Connect to a peer
  $('#connect').click(function() {
    var requestedPeer = $('#rid').val();
    if (!connectedPeers[requestedPeer]) {
      // Create 2 connections, one labelled chat and another labelled file.
      var c = peer.connect(requestedPeer, {
        label: 'chat',
        serialization: 'none',
        metadata: {message: 'hi i want to chat with you!'}
      });
      c.on('open', function() {
        connect(c);
      });
      c.on('error', function(err) { alert(err); });
      var f = peer.connect(requestedPeer, { label: 'file', reliable: true });
      f.on('open', function() {
        connect(f);
      });
      f.on('error', function(err) { alert(err); });
    }
    connectedPeers[requestedPeer] = 1;
  });
  // Close a connection.
  $('#close').click(function() {
    eachActiveConnection(function(c) {
      c.close();
    });
  });

  // Send a chat message to all active connections.
  $('#send').submit(function(e) {
    e.preventDefault();
    // For each active connection, send the message.
    var msg = $('#text').val();
    eachActiveConnection(function(c, $c) {
      if (c.label === 'chat') {
        c.send(msg);
        $c.find('.messages').append('<div><span class="you">You: </span>' + msg
          + '</div>');
      }
    });
    $('#text').val('');
    $('#text').focus();
  });

  // Goes through each active peer and calls FN on its connections.
  function eachActiveConnection(fn) {
    var actives = $('.active');
    var checkedIds = {};
    actives.each(function() {
      var peerId = $(this).attr('id');

      if (!checkedIds[peerId]) {
        var conns = peer.connections[peerId];
        for (var i = 0, ii = conns.length; i < ii; i += 1) {
          var conn = conns[i];
          fn(conn, $(this));
        }
      }

      checkedIds[peerId] = 1;
    });
  }

});// Document ready




function onmatch()
{
  peer = new Peer({
  // Set API key for cloud server (you don't need this if you're running your
  // own.
  key: 'gme13yv5bvvon7b9',

  // Set highest debug level (log everything!).
  debug: 1,

  // Set a logging function:
  logFunction: function() {
    var copy = Array.prototype.slice.call(arguments).join(' ');
    $('.log').append(copy + '<br>');
  }
});


// Show this peer's ID.
peer.on('open', function(id){
  g_id = id;
  var usr = window.localStorage.username;
  console.log(usr);
  $.ajax({
    type: 'POST',
    url: 'http://localhost:3000/match_text/',
    data:{
      peer: g_id,
      user: usr
    },
    success: function(data){
      console.log(data);
          var requestedPeer = data['peer'];
    if (!connectedPeers[requestedPeer]) {
      // Create 2 connections, one labelled chat and another labelled file.
      var c = peer.connect(requestedPeer, {
        label: 'chat',
        serialization: 'none',
        metadata: {message: 'hi i want to chat with you!'}
      });
      c.on('open', function() {
        connect(c);
      });
      c.on('error', function(err) { alert(err); });
      var f = peer.connect(requestedPeer, { label: 'file', reliable: true });
      f.on('open', function() {
        connect(f);
      });
      f.on('error', function(err) { alert(err); });
    }
    connectedPeers[requestedPeer] = 1;
  },
  error: function(err){
    console.log("Failed to match");
  }
  });
  $.ajax({
    type: 'POST',
    url: 'http://localhost:3000/watson/',
    data:{
      twitter : window.localStorage.twitter;
          },
    success: function(data){
      console.log(data);
      for(var s in data)
      {
        $('#hobbies').append('<p>' + s + '</p>')
      }
    },
    error: function(err){
      console.log("Invalid twitter handle probably");
    }
  });
});

// Await connections from others
peer.on('connection', connect);
peer.on('call', answer);
peer.on('error', function(err) {
  console.log(err);
})

// Make sure things clean up properly.

window.onunload = window.onbeforeunload = function(e) {
  if (!!peer && !peer.destroyed) {
    peer.destroy();
  }
};

}


