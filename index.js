var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.set('port', (process.env.PORT || 8080));

app.use(express.static('lib/life-client'));

var $ = require('./lib/tools/tools');
var LS = require('./lib/life-tools/life-state');

var udfp = $.udfp;
var min = $.min;

var nump = $.nump;
var strp = $.strp;

var DEF_ROWS = 80;
var DEF_COLS = 170;
var DEF_SPEED = 10;
var DEF_REFSPEED = 10;

var MAX_SPEED = 100;
var MAX_REFSPEED = 10;

var MAX_SIZE_ROWS = 100;
var MAX_SIZE_COLS = 200;

var states = io.of("/states");

function makeRoom(room){
  console.log("making room", room);
  
  var state = LS.makeLifeState(DEF_ROWS, DEF_COLS);
  
  state.onstart = function (){
    console.log(room, 'state start');
    states.to(room).emit('start');
  };
  
  state.onstop = function (){
    console.log(room, 'state stop');
    states.to(room).emit('stop');
  };
  
  state.onset = function (st, i, j){
    console.log(room, 'send set');
    states.to(room).emit('set', st, i, j);
  };
  
  state.onsetobj = function (st, i, j, obj){
    console.log(room, 'send setobj');
    states.to(room).emit('setobj', st, i, j, obj);
  };
  
  state.onsetstate = function (newstate){
    console.log(room, 'send setstate');
    states.to(room).emit('setstate', newstate);
  };
  
  state.onspeed = function (s){
    console.log(room, 'send speed');
    states.to(room).emit('speed', s);
  };
  
  state.onrefspeed = function (r){
    console.log(room, 'send refspeed');
    states.to(room).emit('refspeed', r);
  };
  
  state.onsize = function (r, c){
    console.log(room, 'send size');
    states.to(room).emit('size', r, c);
  };
  
  state.speed(DEF_SPEED);
  state.refspeed(DEF_REFSPEED);
  
  var colors = [1, 2, 3];
  var currcolor = 0;
  
  var clients = {};
  
  function getColor(id){
    if (!udfp(clients[id]))return clients[id];
    var c = colors[currcolor];
    currcolor++;
    if (currcolor >= colors.length)currcolor = 0;
    clients[id] = c;
    return c;
  }
  
  function addUser(socket){
    socket.join(room);
    
    console.log(room, 'user added', socket.id);
    
    var c = getColor(socket.id);
    
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
        size: state.getSize(),
        color: c
      });
    });
    
    socket.on('fill', function (i, j){
      if (!nump(i) || !nump(j))return;
      console.log(room, 'fill', i, j, 'color', c);
      state.set(c, i, j);
    });
    
    socket.on('empty', function (i, j){
      if (!nump(i) || !nump(j))return;
      console.log(room, 'empty', i, j, 'color', c);
      state.set(0, i, j);
    });
    
    socket.on('fillobj', function (i, j, obj){
      if (!nump(i) || !nump(j))return;
      console.log(room, 'fillobj', i, j, 'color', c);
      state.setObj(c, i, j, obj);
    });
    
    socket.on('color', function (st){
      if (!nump(st))return;
      console.log(room, 'color', st);
      c = st;
      socket.emit('color', st);
    });
    
    socket.on('speed', function (s){
      if (!nump(s))return;
      console.log(room, 'speed ' + s);
      state.speed(min(MAX_SPEED, s));
    });
    
    socket.on('refspeed', function (r){
      if (!nump(r))return;
      console.log(room, 'refspeed ' + r);
      state.refspeed(min(MAX_REFSPEED, r));
    });
    
    socket.on('size', function (r, c){
      if (!nump(r) || !nump(c))return;
      console.log(room, 'size ' + r + ' ' + c);
      state.size(min(MAX_SIZE_ROWS, r), min(MAX_SIZE_COLS, c));
    });
  }
  
  return {
    state: state,
    addUser: addUser
  };
}

function mem(make, defKey){
  if (udfp(defKey))defKey = '';
  
  var m = {};
  
  function get(a){
    if (udfp(a))a = defkey;
    if (!udfp(m[a]))return m[a];
    return m[a] = make(a);
  }
  
  return {
    get: get
  };
}

var rooms = mem(makeRoom, 'global');

states.on('connection', function (socket){
  console.log('a user connected to states');
  
  socket.on('disconnect', function (){
    console.log('user disconnected from states');
  });
  
  socket.on('join', function (room){
    if (!strp(room))return;
    console.log('join', room);
    rooms.get(room).addUser(socket);
  });
});


http.listen(app.get('port'), function(){
  console.log('listening on port ' + app.get('port'));
});
