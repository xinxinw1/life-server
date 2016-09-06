var express = require('express');
var session = require('express-session');
var app = express();
var http = require('http').Server(app);

if (global.io !== undefined){
  var io = global.io;
} else {
  var io = require('socket.io')(http);
}

//console.log(process.env);

var sessionMiddleware = session({
  secret: 'pass',
  resave: true,
  saveUninitialized: true
});
var sharedsession = require("express-socket.io-session");

app.set('port', (process.env.PORT || 8080));
app.set('hostname', process.env.HOSTNAME || undefined);

app.use(sessionMiddleware);

app.use(function (req, res, next){
  //console.log("Server connection with session");
  //console.log(new Date());
  //console.log(req.sessionID);
  next();
});

app.use(express.static(__dirname + '/lib/life-client'));

var $ = require('./lib/tools/tools');

var udfp = $.udfp;
var strp = $.strp;

var LR = require('./life-rooms');

var states = io.of("/states");

var rooms = LR.roomBuilder(states);

states.use(sharedsession(sessionMiddleware, {
  autoSave: true
}));

states.use(function (socket, next){
  console.log("Socket connection with session");
  console.log(new Date());
  console.log(socket.handshake.sessionID);
  next();
});

states.on('connection', function (socket){
  console.log('a user connected to states');
  
  socket.on('disconnect', function (){
    console.log('user disconnected from states');
  });
  
  socket.on('join', function (room){
    if (!strp(room))return;
    console.log('join', room);
    rooms(room).addUser(socket);
  });
});

if (require.main === module){
  http.listen(app.get('port'), app.get('hostname'), function(){
    console.log('listening on port ' + app.get('port'));
  });
} else {
  module.exports = app;
}
