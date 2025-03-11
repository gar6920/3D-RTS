const { Room } = require('colyseus');
const { Schema } = require('@colyseus/schema');
const GameState = require('./entities/gameState');
const { Building, BuildingType } = require('./entities/building');
const { Soldier, SoldierType } = require('./entities/soldier');
const Hero = require('./entities/hero');
const PlayerData = require('./entities/playerData');

class GameRoom extends Room {
  onCreate(options) {
    console.log("GameRoom created!", options);
    
    // Initialize the game state
    this.setState(new GameState());
    
    // Set a maximum number of players for the room
    this.maxClients = 4;
    
    // Set up AI opponent
    this.setupAI();
    
    // Set up tick interval for game logic
    this.setSimulationInterval(() => this.update());
    
    console.log("Game room initialized and ready for players");
  }

  onJoin(client, options) {
    console.log(`Player ${client.sessionId} joined the game`);
    
    // Get player options
    const playerName = options && options.name ? options.name : `Player ${client.sessionId.substr(0, 4)}`;
    
    // Find a starting position for the player
    const startX = Math.floor(Math.random() * 20);
    const startZ = Math.floor(Math.random() * 20);
    
    // Add the player to the game state
    const player = this.state.addPlayer(client.sessionId, playerName, startX, 0, startZ);
    
    // Create a base for the player
    this.createPlayerBase(client.sessionId, startX + 5, 0, startZ + 5);
    
    console.log(`Current number of players: ${Object.keys(this.state.players).length}`);
    
    // Check if game should start
    this.checkGameStart();
  }

  onLeave(client, consented) {
    console.log(`Player ${client.sessionId} left the game`);
    
    // Mark the player as disconnected, but don't remove them immediately
    // This allows them to reconnect
    const player = this.state.getPlayer(client.sessionId);
    if (player) {
      player.connected = false;
      
      // Schedule removal after 60 seconds if they don't reconnect
      this.clock.setTimeout(() => {
        const playerStillExists = this.state.getPlayer(client.sessionId);
        if (playerStillExists && !playerStillExists.connected) {
          this.state.removePlayer(client.sessionId);
          console.log(`Player ${client.sessionId} removed from game after disconnect timeout`);
        }
      }, 60000);
    }
    
    console.log(`Current number of players: ${this.state.getConnectedPlayerCount()}`);
  }
  
  onDispose() {
    console.log("GameRoom disposed");
    // Clear any intervals when the room is disposed
    this.clock.clear();
  }
  
  // Set up the AI opponent
  setupAI() {
    // Initialize AI player with a position in the opposite corner
    const ai = this.state.initializeAI();
    
    // Create a base for the AI
    this.createAIBase();
    
    console.log("AI opponent initialized");
  }
  
  // Create a base for a player
  createPlayerBase(playerId, x, y, z) {
    // Create a unique ID for the building
    const buildingId = `building_${playerId}_base_${Date.now()}`;
    
    // Create the base building
    const base = new Building(BuildingType.BASE, x, y, z, playerId);
    base.id = buildingId;
    base.isConstructed = true; // Base is immediately constructed
    
    // Add the building to the player's collection
    const player = this.state.getPlayer(playerId);
    if (player) {
      player.addBuilding(base);
      console.log(`Created base for player ${playerId} at (${x}, ${y}, ${z})`);
    }
  }
  
  // Create a base and initial buildings for the AI
  createAIBase() {
    if (!this.state.aiPlayer) return;
    
    const aiId = this.state.aiPlayer.id;
    const baseX = 80;
    const baseZ = 80;
    
    // Create main base
    const baseBuildingId = `building_${aiId}_base_${Date.now()}`;
    const base = new Building(BuildingType.BASE, baseX, 0, baseZ, aiId);
    base.id = baseBuildingId;
    base.isConstructed = true;
    this.state.aiPlayer.addBuilding(base);
    
    // Create barracks
    const barracksId = `building_${aiId}_barracks_${Date.now()}`;
    const barracks = new Building(BuildingType.BARRACKS, baseX - 10, 0, baseZ, aiId);
    barracks.id = barracksId;
    barracks.isConstructed = true;
    this.state.aiPlayer.addBuilding(barracks);
    
    // Create resource generator
    const genId = `building_${aiId}_generator_${Date.now()}`;
    const generator = new Building(BuildingType.RESOURCE_GENERATOR, baseX, 0, baseZ - 10, aiId);
    generator.id = genId;
    generator.isConstructed = true;
    this.state.aiPlayer.addBuilding(generator);
    
    // Create a few initial soldiers for the AI
    this.createAISoldier(SoldierType.INFANTRY, baseX - 5, 0, baseZ - 5);
    this.createAISoldier(SoldierType.INFANTRY, baseX - 5, 0, baseZ + 5);
    this.createAISoldier(SoldierType.ARCHER, baseX + 5, 0, baseZ - 5);
    
    console.log("AI base and initial units created");
  }
  
  // Create a soldier for the AI
  createAISoldier(type, x, y, z) {
    if (!this.state.aiPlayer) return;
    
    const aiId = this.state.aiPlayer.id;
    const soldierId = `soldier_${aiId}_${type}_${Date.now()}`;
    
    const soldier = new Soldier(type, x, y, z, aiId);
    soldier.id = soldierId;
    
    this.state.aiPlayer.addSoldier(soldier);
  }
  
  // Check if the game should start
  checkGameStart() {
    const connectedPlayers = this.state.getConnectedPlayerCount();
    
    // Start the game when at least one player is connected
    // (For testing purposes, we can start with just one player)
    if (connectedPlayers > 0 && !this.state.gameStarted) {
      this.state.startGame();
      console.log("Game started!");
    }
  }
  
  // Main update loop
  update() {
    if (!this.state.gameStarted || this.state.gameOver) return;
    
    // Update game time
    this.state.updateElapsedTime();
    
    // Process AI logic
    this.updateAI();
    
    // Update building construction
    this.updateBuildings();
    
    // Update unit movement
    this.updateUnits();
    
    // Check win conditions
    this.checkWinConditions();
  }
  
  // Update AI behavior
  updateAI() {
    // This would contain the AI decision-making logic
    // For now, it's a placeholder
    if (!this.state.aiPlayer) return;
    
    // Generate resources for AI
    if (Math.random() < 0.1) { // 10% chance each tick
      this.state.aiPlayer.addResources(5, 2);
    }
    
    // Occasional AI attacks
    if (Math.random() < 0.005) { // 0.5% chance each tick
      this.initiateAIAttack();
    }
  }
  
  // Initiate an attack by the AI
  initiateAIAttack() {
    if (!this.state.aiPlayer) return;
    
    console.log("AI is launching an attack!");
    
    // Find all AI soldiers
    const aiSoldiers = [];
    for (const id in this.state.aiPlayer.soldiers) {
      aiSoldiers.push(this.state.aiPlayer.soldiers[id]);
    }
    
    // No soldiers to attack with
    if (aiSoldiers.length === 0) return;
    
    // Find a random human player to attack
    const humanPlayers = [];
    for (const id in this.state.players) {
      if (id !== this.state.aiPlayer.id && this.state.players[id].connected) {
        humanPlayers.push(this.state.players[id]);
      }
    }
    
    if (humanPlayers.length === 0) return;
    
    // Select a random player to attack
    const targetPlayer = humanPlayers[Math.floor(Math.random() * humanPlayers.length)];
    
    // Find a target location (the player's base or hero)
    let targetX, targetZ;
    
    // Try to find a base building to attack
    let targetFound = false;
    for (const id in targetPlayer.buildings) {
      const building = targetPlayer.buildings[id];
      if (building.type === BuildingType.BASE) {
        targetX = building.x;
        targetZ = building.z;
        targetFound = true;
        break;
      }
    }
    
    // If no base found, attack the player's hero
    if (!targetFound) {
      targetX = targetPlayer.hero.x;
      targetZ = targetPlayer.hero.z;
    }
    
    // Send all soldiers to attack
    for (const soldier of aiSoldiers) {
      // Add some randomness to prevent all units stacking on the same spot
      const offsetX = Math.random() * 10 - 5;
      const offsetZ = Math.random() * 10 - 5;
      
      soldier.setTargetPosition(targetX + offsetX, 0, targetZ + offsetZ);
    }
    
    console.log(`AI attacking player ${targetPlayer.id} at position (${targetX}, ${targetZ})`);
  }
  
  // Update building construction progress
  updateBuildings() {
    // Update construction progress for all buildings
    for (const playerId in this.state.players) {
      const player = this.state.players[playerId];
      
      for (const buildingId in player.buildings) {
        const building = player.buildings[buildingId];
        
        if (!building.isConstructed) {
          // Progress construction by 0.1 seconds each tick
          const completed = building.updateConstruction(0.1);
          
          if (completed) {
            console.log(`Building ${buildingId} construction completed for player ${playerId}`);
            
            // TODO: Broadcast a message to the player about the completed building
          }
        }
        
        // For resource generators, add resources to the player
        if (building.isConstructed && building.type === BuildingType.RESOURCE_GENERATOR) {
          // Add resources every 10 seconds (approximately)
          if (Math.random() < 0.01) { // 1% chance each tick ≈ every 10 seconds
            player.addResources(building.generationRate, 0);
          }
        }
      }
    }
  }
  
  // Update unit movement
  updateUnits() {
    // Update all heroes and soldiers for all players
    for (const playerId in this.state.players) {
      const player = this.state.players[playerId];
      
      // Update hero movement
      if (player.hero && player.hero.isMoving) {
        this.updateUnitPosition(player.hero);
      }
      
      // Update soldier movements
      for (const soldierId in player.soldiers) {
        const soldier = player.soldiers[soldierId];
        if (soldier.isMoving) {
          this.updateUnitPosition(soldier);
        }
      }
    }
  }
  
  // Update position for a unit (hero or soldier)
  updateUnitPosition(unit) {
    // Calculate direction vector to target
    const dx = unit.targetX - unit.x;
    const dy = unit.targetY - unit.y;
    const dz = unit.targetZ - unit.z;
    
    // Calculate distance to target
    const distanceSquared = dx * dx + dy * dy + dz * dz;
    
    // If we're very close to the target, snap to it and stop moving
    if (distanceSquared < 0.1) {
      unit.x = unit.targetX;
      unit.y = unit.targetY;
      unit.z = unit.targetZ;
      unit.isMoving = false;
      return;
    }
    
    // Normalize the direction vector
    const distance = Math.sqrt(distanceSquared);
    const dirX = dx / distance;
    const dirY = dy / distance;
    const dirZ = dz / distance;
    
    // Calculate the movement step based on speed
    // Assuming each tick is roughly 0.1 seconds
    const step = unit.moveSpeed * 0.1;
    
    // Update position
    unit.x += dirX * step;
    unit.y += dirY * step;
    unit.z += dirZ * step;
  }
  
  // Check win conditions
  checkWinConditions() {
    // Check if the AI's base is destroyed
    if (this.state.isAIBaseDestroyed()) {
      console.log("Players win! AI base destroyed");
      this.state.endGame("players");
      return;
    }
    
    // Check if time is up (handled in updateElapsedTime)
    
    // Check if all players are disconnected
    if (this.state.getConnectedPlayerCount() === 0) {
      console.log("AI wins! All players disconnected");
      this.state.endGame("ai");
      return;
    }
  }

  // Add handler for client messages
  onMessage(client, message, type) {
    console.log(`Received message from ${client.sessionId}: ${type}`, message);
    
    // Handle different message types
    switch (type) {
      case "moveHero":
        this.handleMoveHero(client, message);
        break;
        
      default:
        console.log(`Unknown message type: ${type}`);
    }
  }
  
  // Handle hero movement messages
  handleMoveHero(client, message) {
    const { x, y, z } = message;
    
    // Get the player
    const player = this.state.getPlayer(client.sessionId);
    if (!player) {
      console.log(`Player ${client.sessionId} not found!`);
      return;
    }
    
    console.log(`Moving hero for ${client.sessionId} to position (${x}, ${y}, ${z})`);
    
    // Set the hero's target position
    player.hero.setTargetPosition(x, y, z);
    
    // Broadcast the movement to all clients
    this.broadcast("heroMoved", {
      playerId: client.sessionId,
      x, y, z
    });
  }
}

module.exports = {
  GameRoom
}; 