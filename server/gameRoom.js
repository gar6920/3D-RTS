const { Room } = require('colyseus');
const { Schema, MapSchema, defineTypes } = require('@colyseus/schema');

// Define a basic schema for game state
class GameState extends Schema {}

defineTypes(GameState, {
  players: { type: MapSchema }
});

class GameRoom extends Room {
  onCreate(options) {
    console.log("GameRoom created!", options);
    
    // Initialize the game state
    this.setState(new GameState());
    this.state.players = new MapSchema();
    
    // Set a maximum number of players for the room
    this.maxClients = 4;
    
    console.log("Game room initialized and ready for players");
  }

  onJoin(client, options) {
    console.log(`Player ${client.sessionId} joined the game`);
    
    // Add the player to the game state
    // This is just a placeholder; we'll define proper player schema later
    this.state.players[client.sessionId] = { connected: true };
    
    console.log(`Current number of players: ${Object.keys(this.state.players).length}`);
  }

  onLeave(client, consented) {
    console.log(`Player ${client.sessionId} left the game`);
    
    // Remove the player from the game state
    delete this.state.players[client.sessionId];
    
    console.log(`Current number of players: ${Object.keys(this.state.players).length}`);
  }

  onDispose() {
    console.log("GameRoom disposed");
  }
}

module.exports = {
  GameRoom
}; 