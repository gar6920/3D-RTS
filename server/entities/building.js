const { Schema, type } = require('@colyseus/schema');

/**
 * Building types enum
 */
const BuildingType = {
  BASE: 'base',
  BARRACKS: 'barracks',
  RESOURCE_GENERATOR: 'resourceGenerator',
  TOWER: 'tower'
};

/**
 * Building class representing structures that players can build
 */
class Building extends Schema {
  constructor(type, x = 0, y = 0, z = 0, ownerId = null) {
    super();
    
    // Position
    this.x = x;
    this.y = y;
    this.z = z;
    
    // Building properties
    this.type = type;
    this.ownerId = ownerId;
    
    // Set health and size based on building type
    switch (type) {
      case BuildingType.BASE:
        this.health = 500;
        this.maxHealth = 500;
        this.width = 4;
        this.height = 4;
        this.depth = 4;
        break;
        
      case BuildingType.BARRACKS:
        this.health = 300;
        this.maxHealth = 300;
        this.width = 3;
        this.height = 2;
        this.depth = 3;
        break;
        
      case BuildingType.RESOURCE_GENERATOR:
        this.health = 200;
        this.maxHealth = 200;
        this.width = 2;
        this.height = 2;
        this.depth = 2;
        this.generationRate = 5; // Resources per minute
        this.resourceType = 'materials'; // Default resource type
        break;
        
      case BuildingType.TOWER:
        this.health = 250;
        this.maxHealth = 250;
        this.width = 2;
        this.height = 4;
        this.depth = 2;
        this.range = 10;
        this.damage = 15;
        this.attackSpeed = 1; // Attacks per second
        this.lastAttackTime = 0;
        break;
        
      default:
        this.health = 100;
        this.maxHealth = 100;
        this.width = 1;
        this.height = 1;
        this.depth = 1;
    }
    
    // Building state
    this.isConstructed = false;
    this.constructionProgress = 0;
    this.constructionTime = type === BuildingType.BASE ? 0 : 10; // Seconds to build (base is instant)
  }
  
  /**
   * Take damage and return true if still alive, false if destroyed
   */
  takeDamage(amount) {
    this.health = Math.max(0, this.health - amount);
    return this.health > 0;
  }
  
  /**
   * Repair the building
   */
  repair(amount) {
    this.health = Math.min(this.maxHealth, this.health + amount);
  }
  
  /**
   * Update construction progress
   * @param {number} deltaTime - Time passed since last update in seconds
   * @returns {boolean} - True if construction completed this update
   */
  updateConstruction(deltaTime) {
    if (this.isConstructed) return false;
    
    this.constructionProgress += deltaTime;
    
    if (this.constructionProgress >= this.constructionTime) {
      this.isConstructed = true;
      this.constructionProgress = this.constructionTime;
      return true;
    }
    
    return false;
  }
  
  /**
   * Get construction progress percentage
   */
  getConstructionPercentage() {
    return (this.constructionProgress / this.constructionTime) * 100;
  }
}

// Define the schema types correctly
type("number")(Building.prototype, "x");
type("number")(Building.prototype, "y");
type("number")(Building.prototype, "z");
type("string")(Building.prototype, "type");
type("string")(Building.prototype, "ownerId");
type("number")(Building.prototype, "health");
type("number")(Building.prototype, "maxHealth");
type("number")(Building.prototype, "width");
type("number")(Building.prototype, "height");
type("number")(Building.prototype, "depth");
type("number")(Building.prototype, "generationRate");
type("string")(Building.prototype, "resourceType");
type("number")(Building.prototype, "range");
type("number")(Building.prototype, "damage");
type("number")(Building.prototype, "attackSpeed");
type("number")(Building.prototype, "lastAttackTime");
type("boolean")(Building.prototype, "isConstructed");
type("number")(Building.prototype, "constructionProgress");
type("number")(Building.prototype, "constructionTime");

module.exports = { Building, BuildingType }; 