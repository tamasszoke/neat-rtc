const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

// Enable CORs
io.set('origins', '*:*');
io.on('connection', socket => {

  const room = 'ExampleRoom';
  
  const join = (room) => {
    // Count clients in room
    const clientCount = (typeof io.sockets.adapter.rooms[room] !== 'undefined') ? io.sockets.adapter.rooms[room].length : 0;
    // Check if client can join to the room
    if (clientCount < 2) {
      socket.join(room);
      socket.emit('join', { clientCount: clientCount+1 });
      console.log('Joined to room!');
    } else {
      console.log('Room is full!');
    };
  }
  
  join(room);
  
  socket.on('signaling', message => {
    socket.to(room).emit('signaling', message);
  })
})

server.listen(3001, () => {
	console.log("Socket.IO server is running on localhost:3001");
})