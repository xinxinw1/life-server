var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

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
  io.emit('fill', {i: i, j: j});
};

state.onempty = function (i, j){
  console.log('send empty');
  io.emit('empty', {i: i, j: j});
};

state.onsetstate = function (newstate){
  console.log('send setstate');
  io.emit('setstate', newstate);
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
    state.refresh();
  });
  socket.on('checkstarted', function (){
    console.log('checkstarted');
    if (state.started()){
      io.emit('start');
    } else {
      io.emit('stop');
    }
  });
  socket.on('fill', function (o){
    console.log('fill ' + o.i + ' ' + o.j);
    state.fill(o.i, o.j);
  });
  socket.on('empty', function (o){
    console.log('empty ' + o.i + ' ' + o.j);
    state.empty(o.i, o.j);
  });
});



http.listen(8080, function(){
  console.log('listening on *:8080');
});
