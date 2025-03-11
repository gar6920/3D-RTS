const { Schema, defineTypes } = require('@colyseus/schema');

/**
 * Position schema representing a 3D position with x, y, z coordinates
 */
class Position extends Schema {
  constructor(x = 0, y = 0, z = 0) {
    super();
    this.x = x;
    this.y = y;
    this.z = z;
  }

  /**
   * Sets position from an object with x, y, z properties
   * @param {Object} position - Position object with x, y, z coordinates
   */
  setFromObject(position) {
    this.x = position.x || 0;
    this.y = position.y || 0;
    this.z = position.z || 0;
  }

  /**
   * Calculate distance to another position
   * @param {Position} position - The target position
   * @returns {number} - Distance between positions
   */
  distanceTo(position) {
    const dx = this.x - position.x;
    const dy = this.y - position.y;
    const dz = this.z - position.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
}

defineTypes(Position, {
  x: "number",
  y: "number",
  z: "number"
});

module.exports = { Position }; 