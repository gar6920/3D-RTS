const { Schema, type, ArraySchema, MapSchema } = require('@colyseus/schema');
const Hero = require('./hero');
const { Building } = require('./building');
const { Soldier } = require('./soldier');

/**
 * PlayerData class containing all data related to a single player
 */
class PlayerData extends Schema {
  constructor(id, name, x = 0, y = 0, z = 0) {
    super();
    
    // Player identification
    this.id = id;
    this.name = name || `Player ${id.substring(0, 4)}`;
    this.connected = true;
    
    // Create hero for the player
    this.hero = new Hero(x, y, z);
    
    // Initialize resources
    this.materials = 100; // Starting materials
    this.energy = 50;     // Starting energy
    
    // Initialize collections for buildings and soldiers
    this.buildings = new MapSchema();
    this.soldiers = new MapSchema();
    
    // Player state tracking
    this.isReady = false;
    this.joinTime = Date.now();
    this.score = 0;
  }
  
  /**
   * Add a building to the player's collection
   */
  addBuilding(building) {
    this.buildings[building.id] = building;
  }
  
  /**
   * Remove a building from the player's collection
   */
  removeBuilding(buildingId) {
    if (this.buildings[buildingId]) {
      delete this.buildings[buildingId];
      return true;
    }
    return false;
  }
  
  /**
   * Add a soldier to the player's collection
   */
  addSoldier(soldier) {
    this.soldiers[soldier.id] = soldier;
  }
  
  /**
   * Remove a soldier from the player's collection
   */
  removeSoldier(soldierId) {
    if (this.soldiers[soldierId]) {
      delete this.soldiers[soldierId];
      return true;
    }
    return false;
  }
  
  /**
   * Check if player has enough resources for an action
   */
  hasResources(materialsNeeded, energyNeeded) {
    return this.materials >= materialsNeeded && this.energy >= energyNeeded;
  }
  
  /**
   * Consume resources for an action
   */
  consumeResources(materialsAmount, energyAmount) {
    if (!this.hasResources(materialsAmount, energyAmount)) {
      return false;
    }
    
    this.materials -= materialsAmount;
    this.energy -= energyAmount;
    return true;
  }
  
  /**
   * Add resources to the player
   */
  addResources(materialsAmount, energyAmount) {
    this.materials += materialsAmount;
    this.energy += energyAmount;
  }
  
  /**
   * Count how many buildings of a specific type the player has
   */
  countBuildingsByType(buildingType) {
    let count = 0;
    for (const id in this.buildings) {
      if (this.buildings[id].type === buildingType) {
        count++;
      }
    }
    return count;
  }
  
  /**
   * Count how many soldiers of a specific type the player has
   */
  countSoldiersByType(soldierType) {
    let count = 0;
    for (const id in this.soldiers) {
      if (this.soldiers[id].type === soldierType) {
        count++;
      }
    }
    return count;
  }
  
  /**
   * Get player's total military strength (sum of all soldier health)
   */
  getMilitaryStrength() {
    let strength = 0;
    for (const id in this.soldiers) {
      strength += this.soldiers[id].health;
    }
    return strength;
  }
  
  /**
   * Add points to the player's score
   */
  addScore(points) {
    this.score += points;
  }
}

// Define the schema types correctly
type("string")(PlayerData.prototype, "id");
type("string")(PlayerData.prototype, "name");
type("boolean")(PlayerData.prototype, "connected");
type(Hero)(PlayerData.prototype, "hero");
type("number")(PlayerData.prototype, "materials");
type("number")(PlayerData.prototype, "energy");
type({ map: "any" })(PlayerData.prototype, "buildings");
type({ map: "any" })(PlayerData.prototype, "soldiers");
type("boolean")(PlayerData.prototype, "isReady");
type("number")(PlayerData.prototype, "joinTime");
type("number")(PlayerData.prototype, "score");

module.exports = PlayerData; 