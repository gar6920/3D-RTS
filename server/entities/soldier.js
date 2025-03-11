const { Schema, type } = require('@colyseus/schema');

/**
 * Soldier types enum
 */
const SoldierType = {
  INFANTRY: 'infantry',
  ARCHER: 'archer',
  CAVALRY: 'cavalry'
};

/**
 * Soldier class representing military units that players can recruit
 */
class Soldier extends Schema {
  constructor(soldierType, x = 0, y = 0, z = 0, ownerId = null) {
    super();
    
    // Position
    this.x = x;
    this.y = y;
    this.z = z;
    
    // Basic properties
    this.type = soldierType;
    this.ownerId = ownerId;
    
    // Movement
    this.moveSpeed = 0;
    this.targetX = x;
    this.targetY = y;
    this.targetZ = z;
    this.isMoving = false;
    
    // Combat properties
    this.attackRange = 0;
    this.attackDamage = 0;
    this.attackSpeed = 0;
    this.lastAttackTime = 0;
    
    // Set properties based on soldier type
    switch (soldierType) {
      case SoldierType.INFANTRY:
        this.health = 80;
        this.maxHealth = 80;
        this.moveSpeed = 3;
        this.attackRange = 1;
        this.attackDamage = 15;
        this.attackSpeed = 1; // Attacks per second
        break;
        
      case SoldierType.ARCHER:
        this.health = 50;
        this.maxHealth = 50;
        this.moveSpeed = 4;
        this.attackRange = 8;
        this.attackDamage = 20;
        this.attackSpeed = 0.7; // Attacks per second
        break;
        
      case SoldierType.CAVALRY:
        this.health = 100;
        this.maxHealth = 100;
        this.moveSpeed = 6;
        this.attackRange = 1;
        this.attackDamage = 25;
        this.attackSpeed = 0.8; // Attacks per second
        break;
        
      default:
        this.health = 50;
        this.maxHealth = 50;
        this.moveSpeed = 3;
        this.attackRange = 1;
        this.attackDamage = 10;
        this.attackSpeed = 1;
    }
  }
  
  /**
   * Set target position for movement
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
   * Heal the soldier
   */
  heal(amount) {
    this.health = Math.min(this.maxHealth, this.health + amount);
  }
  
  /**
   * Check if soldier can attack a target at the specified position
   */
  canAttack(targetX, targetY, targetZ) {
    const dx = this.x - targetX;
    const dy = this.y - targetY;
    const dz = this.z - targetZ;
    const distanceSquared = dx * dx + dy * dy + dz * dz;
    return distanceSquared <= this.attackRange * this.attackRange;
  }
  
  /**
   * Check if enough time has passed to attack again
   */
  canAttackNow(currentTime) {
    return currentTime - this.lastAttackTime >= (1000 / this.attackSpeed);
  }
  
  /**
   * Perform an attack and update the last attack time
   */
  performAttack(currentTime) {
    this.lastAttackTime = currentTime;
    return this.attackDamage;
  }
}

// Define the schema types correctly
type("number")(Soldier.prototype, "x");
type("number")(Soldier.prototype, "y");
type("number")(Soldier.prototype, "z");
type("string")(Soldier.prototype, "type");
type("string")(Soldier.prototype, "ownerId");
type("number")(Soldier.prototype, "health");
type("number")(Soldier.prototype, "maxHealth");
type("number")(Soldier.prototype, "moveSpeed");
type("number")(Soldier.prototype, "targetX");
type("number")(Soldier.prototype, "targetY");
type("number")(Soldier.prototype, "targetZ");
type("boolean")(Soldier.prototype, "isMoving");
type("number")(Soldier.prototype, "attackRange");
type("number")(Soldier.prototype, "attackDamage");
type("number")(Soldier.prototype, "attackSpeed");
type("number")(Soldier.prototype, "lastAttackTime");

module.exports = { Soldier, SoldierType }; 