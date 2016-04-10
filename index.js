var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.set('port', (process.env.PORT || 8080));

app.use(express.static('lib/life-client'));

var $ = require('./lib/tools/tools');
var LS = require('./lib/life-tools/life-state');

var nsp = io.of("/states");

var rooms = {};

var udfp = $.udfp;
var min = $.min;

var MAX_SPEED = 100;
var MAX_REFSPEED = 10;

var MAX_SIZE_ROWS = 100;
var MAX_SIZE_COLS = 200;

function makeRoom(room){
  if (udfp(room))room = "global";
  console.log("making room", room);
  
  var state = LS.makeLifeState(80, 170);
  
  state.onstart = function (){
    console.log(room, 'state start');
    nsp.to(room).emit('start');
  };
  
  state.onstop = function (){
    console.log(room, 'state stop');
    nsp.to(room).emit('stop');
  };
  
  state.onfill = function (i, j){
    console.log(room, 'send fill');
    nsp.to(room).emit('fill', i, j);
  };
  
  state.onempty = function (i, j){
    console.log(room, 'send empty');
    nsp.to(room).emit('empty', i, j);
  };
  
  state.onfillobj = function (i, j, obj){
    console.log(room, 'send fillobj');
    nsp.to(room).emit('fillobj', i, j, obj);
  };
  
  state.onsetstate = function (newstate){
    console.log(room, 'send setstate');
    nsp.to(room).emit('setstate', newstate);
  };
  
  state.onspeed = function (s){
    console.log(room, 'send speed');
    nsp.to(room).emit('speed', s);
  };
  
  state.onrefspeed = function (r){
    console.log(room, 'send refspeed');
    nsp.to(room).emit('refspeed', r);
  };
  
  state.onsize = function (r, c){
    console.log(room, 'send size');
    nsp.to(room).emit('size', r, c);
  };
  
  function addUser(socket){
    socket.join(room);
    
    console.log(room, 'user added');
    
    socket.emit('joined');
    
    socket.on('disconnect', function (){
      console.log(room, 'user disconnected');
    });
    
    socket.on('start', function (){
      console.log(room, 'start');
      state.start();
    });
    
    socket.on('stop', function (){
      console.log(room, 'stop');
      state.stop();
    });
    
    socket.on('step', function (){
      console.log(room, 'step');
      state.step();
    });
    
    socket.on('clear', function (){
      console.log(room, 'clear');
      state.clear();
    });
    
    socket.on('refresh', function (){
      console.log(room, 'refresh');
      socket.emit('setstate', state.getState());
    });
    
    socket.on('copystate', function (){
      console.log(room, 'copystate');
      socket.emit('copystate', {
        started: state.started(),
        state: state.getState(),
        speed: state.getSpeed(),
        refspeed: state.getRefspeed(),
        size: state.getSize()
      });
    });
    
    socket.on('fill', function (i, j){
      console.log(room, 'fill ' + i + ' ' + j);
      state.fill(i, j);
    });
    
    socket.on('empty', function (i, j){
      console.log(room, 'empty ' + i + ' ' + j);
      state.empty(i, j);
    });
    
    socket.on('fillobj', function (i, j, obj){
      console.log(room, 'fillobj');
      state.fillObj(i, j, obj);
    });
    
    socket.on('speed', function (s){
      console.log(room, 'speed ' + s);
      state.speed(min(MAX_SPEED, s));
    });
    
    socket.on('refspeed', function (r){
      console.log(room, 'refspeed ' + r);
      state.refspeed(min(MAX_REFSPEED, r));
    });
    
    socket.on('size', function (r, c){
      console.log(room, 'size ' + r + ' ' + c);
      state.size(min(MAX_SIZE_ROWS, r), min(MAX_SIZE_COLS, c));
    });
  }
  
  return {
    state: state,
    addUser: addUser
  };
}

function getRoom(room){
  if (udfp(room))room = "global";
  console.log("getting room", room);
  if (!udfp(rooms[room])){
    console.log("room", room, "already exists");
    return rooms[room];
  }
  var r = makeRoom(room);
  rooms[room] = r;
  return r;
}

nsp.on('connection', function (socket){
  console.log('a user connected to states');
  
  socket.on('disconnect', function (){
    console.log('user disconnected from states');
  });
  
  socket.on('join', function (room){
    console.log('join', room);
    getRoom(room).addUser(socket);
  });
});


http.listen(app.get('port'), function(){
  console.log('listening on port ' + app.get('port'));
});
