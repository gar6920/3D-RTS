// Export all entities from a single file for easier imports
const { Position } = require('./position');
const { Hero } = require('./hero');
const { Building, BuildingType } = require('./building');
const { Soldier, SoldierType } = require('./soldier');
const { PlayerData } = require('./playerData');
const { GameState } = require('./gameState');

module.exports = {
  Position,
  Hero,
  Building,
  BuildingType,
  Soldier,
  SoldierType,
  PlayerData,
  GameState
}; 