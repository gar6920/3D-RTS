const { Schema, type, MapSchema } = require('@colyseus/schema');
const PlayerData = require('./playerData');

/**
 * GameState class containing the entire game state
 */
class GameState extends Schema {
  constructor() {
    super();
    
    // Map of player ID to PlayerData
    this.players = new MapSchema();
    
    // AI opponent
    this.aiPlayer = null;
    
    // Game settings
    this.mapSize = 100; // Size of the game map
    this.matchDuration = 60 * 60 * 1000; // Match duration in ms (1 hour)
    
    // Game status
    this.gameStarted = false;
    this.gameOver = false;
    this.winner = null;
    this.startTime = null;
    this.elapsedTime = 0;
  }
  
  /**
   * Add a player to the game
   */
  addPlayer(id, name, x, y, z) {
    const player = new PlayerData(id, name, x, y, z);
    this.players[id] = player;
    return player;
  }
  
  /**
   * Remove a player from the game
   */
  removePlayer(id) {
    if (this.players[id]) {
      delete this.players[id];
      return true;
    }
    return false;
  }
  
  /**
   * Get a player by ID
   */
  getPlayer(id) {
    return this.players[id];
  }
  
  /**
   * Initialize the AI player
   */
  initializeAI(id = 'ai', x = 80, y = 0, z = 80) {
    this.aiPlayer = new PlayerData(id, 'AI Opponent', x, y, z);
    this.aiPlayer.materials = 200; // AI starts with more resources
    this.aiPlayer.energy = 100;
    return this.aiPlayer;
  }
  
  /**
   * Start the game
   */
  startGame() {
    this.gameStarted = true;
    this.startTime = Date.now();
  }
  
  /**
   * Update the game elapsed time
   */
  updateElapsedTime() {
    if (this.gameStarted && !this.gameOver && this.startTime) {
      this.elapsedTime = Date.now() - this.startTime;
      
      // Check if match time is up
      if (this.elapsedTime >= this.matchDuration) {
        this.endGame('ai'); // AI wins if time runs out
      }
    }
    
    return this.elapsedTime;
  }
  
  /**
   * End the game with a winner
   */
  endGame(winnerId) {
    this.gameOver = true;
    this.winner = winnerId;
  }
  
  /**
   * Get remaining match time in milliseconds
   */
  getRemainingTime() {
    if (!this.gameStarted || this.gameOver) {
      return 0;
    }
    
    return Math.max(0, this.matchDuration - this.elapsedTime);
  }
  
  /**
   * Check if AI's main base is destroyed
   */
  isAIBaseDestroyed() {
    if (!this.aiPlayer) return false;
    
    // Check if AI has any base buildings left
    let hasBase = false;
    for (const id in this.aiPlayer.buildings) {
      const building = this.aiPlayer.buildings[id];
      if (building.type === 'base' && building.health > 0) {
        hasBase = true;
        break;
      }
    }
    
    return !hasBase;
  }
  
  /**
   * Get the number of connected human players
   */
  getConnectedPlayerCount() {
    let count = 0;
    for (const id in this.players) {
      if (this.players[id].connected) {
        count++;
      }
    }
    return count;
  }
}

// Define the schema types correctly
type({ map: PlayerData })(GameState.prototype, "players");
type(PlayerData)(GameState.prototype, "aiPlayer");
type("number")(GameState.prototype, "mapSize");
type("number")(GameState.prototype, "matchDuration");
type("boolean")(GameState.prototype, "gameStarted");
type("boolean")(GameState.prototype, "gameOver");
type("string")(GameState.prototype, "winner");
type("number")(GameState.prototype, "startTime");
type("number")(GameState.prototype, "elapsedTime");

module.exports = GameState; 