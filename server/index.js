const http = require('http');
const express = require('express');
const { Server } = require('colyseus');
const { GameRoom } = require('./gameRoom');

// Create Express app and HTTP server
const app = express();
const port = process.env.PORT || 3000;

// Serve static files from the client directory
app.use(express.static('client'));

// Create HTTP server and Colyseus server
const httpServer = http.createServer(app);
const gameServer = new Server({
  server: httpServer
});

// Register the game room
gameServer.define('game_room', GameRoom);

// Start the server
httpServer.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
  console.log(`Colyseus server listening on ws://localhost:${port}`);
}); 