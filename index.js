var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.set('port', (process.env.PORT || 8080));

app.use(express.static('lib/life-client'));

var LS = require('./lib/life-tools/life-state.js');


var state = LS.makeLifeState(80, 170);

state.onstart = function (){
  console.log('state start');
  io.emit('start');
};

state.onstop = function (){
  console.log('state stop');
  io.emit('stop');
};

state.onfill = function (i, j){
  console.log('send fill');
  io.emit('fill', i, j);
};

state.onempty = function (i, j){
  console.log('send empty');
  io.emit('empty', i, j);
};

state.onfillobj = function (i, j, obj){
  console.log('send fillobj');
  io.emit('fillobj', i, j, obj);
};

state.onsetstate = function (newstate){
  console.log('send setstate');
  io.emit('setstate', newstate);
};

state.onspeed = function (s){
  console.log('send speed');
  io.emit('speed', s);
};

state.onrefspeed = function (r){
  console.log('send refspeed');
  io.emit('refspeed', r);
};

state.onsize = function (r, c){
  console.log('send size');
  io.emit('size', r, c);
};

io.on('connection', function (socket){
  console.log('a user connected');
  
  socket.on('disconnect', function (){
    console.log('user disconnected');
  });
  
  socket.on('start', function (){
    console.log('start');
    state.start();
  });
  
  socket.on('stop', function (){
    console.log('stop');
    state.stop();
  });
  
  socket.on('step', function (){
    console.log('step');
    state.step();
  });
  
  socket.on('clear', function (){
    console.log('clear');
    state.clear();
  });
  
  socket.on('refresh', function (){
    console.log('refresh');
    socket.emit('setstate', state.getState());
  });
  
  socket.on('copystate', function (){
    console.log('copystate');
    socket.emit('copystate', {
      started: state.started(),
      state: state.getState(),
      speed: state.getSpeed(),
      refspeed: state.getRefspeed(),
      size: state.getSize()
    });
  });
  
  socket.on('fill', function (i, j){
    console.log('fill ' + i + ' ' + j);
    state.fill(i, j);
  });
  
  socket.on('empty', function (i, j){
    console.log('empty ' + i + ' ' + j);
    state.empty(i, j);
  });
  
  socket.on('fillobj', function (i, j, obj){
    console.log('fillobj');
    state.fillObj(i, j, obj);
  });
  
  socket.on('speed', function (s){
    console.log('speed ' + s);
    state.speed(s);
  });
  
  socket.on('refspeed', function (r){
    console.log('refspeed ' + r);
    state.refspeed(r);
  });
  
  socket.on('size', function (r, c){
    console.log('size ' + r + ' ' + c);
    state.size(r, c);
  });
  
});



http.listen(app.get('port'), function(){
  console.log('listening on port ' + app.get('port'));
});
