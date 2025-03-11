const { Schema, type } = require('@colyseus/schema');

/**
 * Hero class representing a player-controlled unit
 * Each player controls one hero in the game
 */
class Hero extends Schema {
  constructor(x = 0, y = 0, z = 0) {
    super();
    
    // Initial position
    this.x = x;
    this.y = y;
    this.z = z;
    
    // Initial stats
    this.health = 100;
    this.maxHealth = 100;
    this.level = 1;
    this.experience = 0;
    
    // Movement
    this.moveSpeed = 5;
    this.targetX = x;
    this.targetY = y;
    this.targetZ = z;
    this.isMoving = false;
    
    // Identification
    this.name = "Hero";
  }

  /**
   * Set the target position for movement
   */
  setTargetPosition(x, y, z) {
    this.targetX = x;
    this.targetY = y;
    this.targetZ = z;
    this.isMoving = true;
  }

  /**
   * Take damage and return true if still alive, false if dead
   */
  takeDamage(amount) {
    this.health = Math.max(0, this.health - amount);
    return this.health > 0;
  }

  /**
   * Heal the hero by the specified amount
   */
  heal(amount) {
    this.health = Math.min(this.maxHealth, this.health + amount);
  }

  /**
   * Add experience points and level up if necessary
   */
  addExperience(amount) {
    this.experience += amount;
    // Simple level up formula: level * 100 experience needed per level
    const expNeeded = this.level * 100;
    
    if (this.experience >= expNeeded) {
      this.experience -= expNeeded;
      this.level++;
      this.maxHealth += 20;
      this.health = this.maxHealth; // Full heal on level up
      return true; // Indicates level up occurred
    }
    
    return false;
  }

  /**
   * Check if hero can attack based on attack speed
   * @param {number} currentTime - Current game time
   * @returns {boolean} - True if hero can attack
   */
  canAttack(currentTime) {
    return currentTime - this.lastAttackTime >= 1000 / this.attackSpeed;
  }

  /**
   * Perform an attack
   * @param {number} currentTime - Current game time
   */
  attack(currentTime) {
    this.lastAttackTime = currentTime;
  }
}

// Define the schema types using the correct Colyseus pattern
type("number")(Hero.prototype, "x");
type("number")(Hero.prototype, "y");
type("number")(Hero.prototype, "z");
type("number")(Hero.prototype, "health");
type("number")(Hero.prototype, "maxHealth");
type("number")(Hero.prototype, "level");
type("number")(Hero.prototype, "experience");
type("number")(Hero.prototype, "moveSpeed");
type("number")(Hero.prototype, "targetX");
type("number")(Hero.prototype, "targetY");
type("number")(Hero.prototype, "targetZ");
type("boolean")(Hero.prototype, "isMoving");
type("string")(Hero.prototype, "name");

module.exports = Hero; 