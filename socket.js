// socket.js
const socketIo = require('socket.io');

let io;
module.exports = {
  init: (server) => {
    io = socketIo(server, {
      cors: {
        origin: '*',  // Allow all origins, you can restrict this to specific domains like 'http://localhost:3000'
        methods: ['GET', 'POST'],
      },
    });
    return io;
  },
  getIo: () => io,
};
