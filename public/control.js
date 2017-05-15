var socket = io();
//var socket = io.connect("/regular");
var connectedPeers = {};
var lang;
//redirect if not logged in
if(window.localStorage.getItem('_id') === null)
{
  window.location.replace('login.html');
}

$(document).ready(function() {
  //open a connection
  $('#connect').on('click', function(event) {
    socket.open()
    console.log('opening connection');
    var usrdata = 
    {
      socketid: socket.id,
      user: window.localStorage.getItem('username'),
      age: window.localStorage.getItem('Age'),
      ethnicity: window.localStorage.getItem('Ethnicity'),
      gender: window.localStorage.getItem('Gender'),
      religion: window.localStorage.getItem('Religion'),
      orientation: window.localStorage.getItem('Sexual Orientation')
    };
    $('#connect').prop('disabled', true)
    $.ajax({
      type: 'POST',
      url: 'https://cit-i-zen.herokuapp.com:443/match_text/',
      data: usrdata,
      success: function(match){
        console.log('matched with ' + match.id);        
        var requested = match.id;
        if (!connectedPeers[requested]) {
          socket.emit('room', {id : requested, lang : window.localStorage.language})
          enableFeatures();
        }
      },
      error: function(err){
        console.log(JSON.stringify(err))
        if(err.status == '500')
        {
          $('#connect').text('Waiting for connection')
        }
      }
    });
    
    // Await connections from others
    socket.on('join', function(data) {
      socket.emit('join', {room : data.room, lang : window.localStorage.language})
      enableFeatures()
      setUpChatBox(data.id, data.lang)
    })
    socket.on('joined', function(data) {
      setUpChatBox(data.id, data.lang)
    })
    
    // Close connections.
    $('#close').click(function() {
      if(peer)
      {
        peer.destroy();
      }

      socket.close();
    });
    // Call a peer
    $('#call').on('click', function(event) {
      eachActiveConnection(call);
    })
    // Send a chat message to all active connections.
    $('#send').on('click', function(e) {
      e.preventDefault();
      // For each active connection, send the message.
      var msg = $('#text').val();
      if(msg)
      {
        eachActiveConnection(function(peerId, $c) {
          socket.emit('chat', {id: socket.id, text: msg})
          $c.find('.messages').append('<div><span class="you">You: </span>' + msg
            + '</div>');
        });
        $('#text').val('');
        $('#text').focus();
      }
    });
    $('.connection').on('click', function() {
      if ($(this).attr('class').indexOf('active') === -1) {
        $(this).addClass('active');
      } else {
        $(this).removeClass('active');
      }
    });
  });
  //Initializes Chatbox
  function setUpChatBox(target, language) {
    lang = language;
    var chatbox = $('#message').addClass('connection').addClass('active').attr('id', target);
    var header = $('<h1></h1>').html('Chat with <strong>' + target + '</strong>');
    var messages = $('<div><em>Peer connected.</em></div>').addClass('messages');
    chatbox.append(header);
    chatbox.append(messages);
    connectedPeers[target] = true;
  }
  // Goes through each active peer and calls FN on its connections.
  function eachActiveConnection(fn) {
    var actives = $('.active');
    var checkedIds = {};
    actives.each(function() {
      var peerId = $(this).attr('id');

      if (!checkedIds[peerId]) {
        var connected = connectedPeers[peerId];
        if(connected)
          fn(peerId, $(this));
      }
      checkedIds[peerId] = true;
    });
  }

  $('#match').click(function(e) {
    findmatch();
  });
});// Document ready

function enableFeatures() {
  $('#connect').text('Connection Found')
  $('#connect').prop('disabled', true)
  $('#close').removeProp('disabled')
  $('#close').text('Close Connection') 
  $('#call').removeProp('disabled')
  $('#call').text('Videocall')
  $('#send').removeProp('disabled')
  $('#send').text('Send Message')
}


function disableFeatures() {
  $('#call').prop('disabled', true)
  $('#call').text('Connect First before calling')
  $('#send').prop('disabled', true)
  $('#send').text('Connect First before messaging')
  $('#close').prop('disabled', true)
  $('#close').text('No Connections to Close') 
  $('#connect').removeProp('disabled')
  $('#connect').text('Connect')
}



function findmatch() {
  disableFeatures();
  $('#match').prop('disabled', true)
  //output twitter data
  $('#hobbies').html('<p>Analyzing twitter accounts...</p>')
  $.ajax({
    type: 'POST',
    url: 'https://cit-i-zen.herokuapp.com:443/watson/',
    data:{
      twitter : window.localStorage.twitter
    },
    success: function(data){
      console.log(data);
      $('#hobbies').empty()
      if(data.error)
      {
        $('#hobbies').append('<p>Could not retrieve Twitter analytics</p>')
      }
      else
      {
        $('#hobbies').append('<p>Twitter analytics results:</p>')
        for(var s of data)
        {
          $('#hobbies').append('<p>' + s + '</p>')
        }
      }
    },
    error: function(err){
      console.log("connection disrupted");
    }
  });

}

// Show this peer's ID.


socket.on('chat', function(data) {
  $('.messages').append('<div><p><strong>' + data.id + ':</strong> ' + data.text +
    '</p>');
  if(window.localStorage.language !== lang)
  {
    $.ajax({
      type: 'POST',
      url: 'https://cit-i-zen.herokuapp.com:443/translate/',
      data:{
      text: data.text,
      target: window.localStorage.language,
      source: lang
      },
      success: function(data){
        console.log(data)
        if(data.error)
          $('.messages').append('<p>' + JSON.stringify(data.error) + '</p></div>')
        else
          $('.messages').append('<p>' + data + '</p></div>')
      },
      error: function(err){
        console.log(JSON.stringify(err))
        $('.messages').append('<p>' + JSON.stringify(JSON.stringify(err)) + '</p></div>')
      }
    });
  }
});

socket.on('kill', function(data) {
    console.log(data + ' has left the chat.');
    $('.connection').filter(function(){return $(this).attr('id') === data}).remove();
    connectedPeers[data] = false;
    disableFeatures();
    mediapromise = null;
});

socket.on('disconnect', function(data){
  $('.connection').empty();
  for(var a in connectedPeers)
    connectedPeers[a] = false;
  disableFeatures();
  mediapromise = null;
})
socket.on('call', function(){
  console.log("got call")
  answer()
})
socket.on('error', function(err) {
  console.log(JSON.stringify(err));
})
// Make sure things clean up properly.
window.onunload = window.onbeforeunload = function(e) {
  disableFeatures()
  if(peer) {
    peer.destroy();
  }
  if (socket) {
    socket.close();
  }
};
