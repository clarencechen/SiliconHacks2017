
/*var fs = require('fs');
var ssl_options = {
    key:fs.readFileSync('./peerssl/here.pem'),
    ca:fs.readFileSync('./peerssl/GandiStandardSSLCA2.pem'),
    cert:fs.readFileSync('./peerssl/here.crt'),
    honorCipherOrder: true,
    ciphers: 'ECDHE-RSA-AES128-SHA256:AES128-GCM-SHA256:HIGH:!RC4:!MD5:!aNULL:!EDH'
}*/
var express = require('express'),
    app = express(),
    path = require('path'),
    port = 3000,
    bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
var routes = require('./api/routes/routes.js');
routes(app);
app.use(express.static(__dirname + '/public'));

var server = require('http').Server(app);
var io = require('socket.io')(server);

var peerjs_options = {
    debug: true
}
var peerServer = require('peer').ExpressPeerServer(server, peerjs_options);
app.use('/call', peerServer);

server.listen(process.env.PORT || port);



console.log("working on " + process.env.PORT);
var counter = 0;
var connections = {};
io.on('connection', function(client){
  console.log(client.id + ' connected');
  client.on('chat', function(data){
    console.log(data)
    client.broadcast.to(connections[client.id]).emit('chat', data)
  });
  client.on('room', function(data){
    console.log('room ' + counter + ' established')
    client.join(counter)
    connections[client.id] = counter;
    client.to(data.id).emit('join', {id : client.id, room : counter, lang : data.lang})
    counter += 1
  })
  client.on('join', function(data){
    var roomnum = data.room
    console.log('room ' + roomnum + ' filled')
    client.join(roomnum)
    connections[client.id] = roomnum;
    client.broadcast.to(roomnum).emit('joined', {id : client.id, lang : data.lang})
  })
  client.on('disconnect', function(){
    console.log(client.id + ' disconnected');
    client.broadcast.to(connections[client.id]).emit('kill', client.id)
  })
  client.on('call', function(){
    console.log('someone is calling')
    client.broadcast.to(connections[client.id]).emit('call')
  })
  client.on('answered', function(){
    console.log('someone picked up')
    client.broadcast.to(connections[client.id]).emit('answered')
  })
});


