const http = require('http');
const express = require('express');
const { Server } = require('colyseus');
const { WebSocketTransport } = require('@colyseus/ws-transport');
const { GameRoom } = require('./gameRoom');
const { TestRoom } = require('./testSchema');

// Create Express app and HTTP server
const app = express();
const port = process.env.PORT || 3000;

// Serve static files from the client directory
app.use(express.static('client'));

// Create HTTP server and Colyseus server
const httpServer = http.createServer(app);
const gameServer = new Server({
  transport: new WebSocketTransport({
    server: httpServer
  })
});

// Register the game room
gameServer.define('game_room', GameRoom);

// Register the test room
gameServer.define('test_room', TestRoom);

// Start the server
httpServer.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
  console.log(`Colyseus server listening on ws://localhost:${port}`);
}); 