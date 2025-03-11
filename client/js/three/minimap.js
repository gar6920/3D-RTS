/**
 * Minimap rendering for Conqueror's Quest
 */

class MinimapManager {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.mapSize = 100; // Should match server's map size
        this.entities = new Map();
        this.playerMarkerSize = 5;
        this.buildingMarkerSize = 4;
        this.soldierMarkerSize = 2;
        
        // Colors for different entity types
        this.colors = {
            player: 'blue',
            playerHero: 'cyan',
            playerBuilding: 'lightblue',
            playerSoldier: 'cornflowerblue',
            
            enemy: 'red',
            enemyHero: 'crimson',
            enemyBuilding: 'firebrick',
            enemySoldier: 'tomato',
            
            ai: 'purple',
            aiHero: 'darkorchid',
            aiBuilding: 'mediumpurple',
            aiSoldier: 'orchid'
        };
        
        // Bind methods
        this.handleClick = this.handleClick.bind(this);
    }
    
    /**
     * Initialize the minimap
     */
    initialize() {
        // Get canvas element
        this.canvas = document.getElementById('minimap-canvas');
        if (!this.canvas) {
            console.error('Minimap canvas element not found!');
            return;
        }
        
        // Get drawing context
        this.ctx = this.canvas.getContext('2d');
        
        // Set canvas dimensions
        this.canvas.width = this.canvas.clientWidth;
        this.canvas.height = this.canvas.clientHeight;
        
        // Add click event listener
        this.canvas.addEventListener('click', this.handleClick);
        
        console.log('Minimap initialized');
    }
    
    /**
     * Clear the minimap
     */
    clear() {
        if (!this.ctx) return;
        
        // Clear the entire canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw minimap background
        this.ctx.fillStyle = '#222';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid lines
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 0.5;
        
        const gridSize = 10;
        const gridStep = this.canvas.width / gridSize;
        
        this.ctx.beginPath();
        
        // Draw vertical grid lines
        for (let i = 1; i < gridSize; i++) {
            const x = i * gridStep;
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
        }
        
        // Draw horizontal grid lines
        for (let i = 1; i < gridSize; i++) {
            const y = i * gridStep;
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
        }
        
        this.ctx.stroke();
    }
    
    /**
     * Convert world position to minimap position
     * @param {number} x - World X coordinate
     * @param {number} z - World Z coordinate
     * @returns {object} - Minimap coordinates {x, y}
     */
    worldToMinimap(x, z) {
        // Convert world coordinates to minimap coordinates
        const minimapX = (x / this.mapSize) * this.canvas.width;
        const minimapY = (z / this.mapSize) * this.canvas.height;
        
        return { x: minimapX, y: minimapY };
    }
    
    /**
     * Convert minimap position to world position
     * @param {number} x - Minimap X coordinate
     * @param {number} y - Minimap Y coordinate
     * @returns {object} - World coordinates {x, z}
     */
    minimapToWorld(x, y) {
        // Convert minimap coordinates to world coordinates
        const worldX = (x / this.canvas.width) * this.mapSize;
        const worldZ = (y / this.canvas.height) * this.mapSize;
        
        return { x: worldX, z: worldZ };
    }
    
    /**
     * Draw a hero on the minimap
     * @param {string} id - Entity ID
     * @param {object} data - Hero data
     * @param {string} ownerId - Owner ID
     * @param {string} playerId - Current player ID
     */
    drawHero(id, data, ownerId, playerId) {
        if (!this.ctx) return;
        
        const { x, y } = this.worldToMinimap(data.x, data.z);
        
        this.ctx.beginPath();
        
        // Determine color based on ownership
        let color;
        if (ownerId === playerId) {
            color = this.colors.playerHero;
        } else if (ownerId === 'ai') {
            color = this.colors.aiHero;
        } else {
            color = this.colors.enemyHero;
        }
        
        this.ctx.fillStyle = color;
        
        // Draw hero marker (triangle for directionality)
        this.ctx.beginPath();
        const size = this.playerMarkerSize;
        
        // Calculate direction angle (if available)
        let angle = 0;
        if (data.rotation !== undefined) {
            angle = data.rotation;
        } else if (data.targetX !== undefined && data.targetZ !== undefined) {
            // Calculate angle from current position to target
            const dx = data.targetX - data.x;
            const dz = data.targetZ - data.z;
            angle = Math.atan2(dz, dx);
        }
        
        // Draw triangle pointing in the movement direction
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.rotate(angle - Math.PI / 2); // Adjust for triangle orientation
        
        this.ctx.beginPath();
        this.ctx.moveTo(0, -size);
        this.ctx.lineTo(-size/1.5, size/1.5);
        this.ctx.lineTo(size/1.5, size/1.5);
        this.ctx.closePath();
        
        this.ctx.fill();
        this.ctx.restore();
        
        // Store entity for click detection
        this.entities.set(id, {
            type: 'hero',
            ownerId,
            x: data.x,
            z: data.z,
            minimapX: x,
            minimapY: y,
            radius: this.playerMarkerSize
        });
    }
    
    /**
     * Draw a building on the minimap
     * @param {string} id - Entity ID
     * @param {object} data - Building data
     * @param {string} ownerId - Owner ID
     * @param {string} playerId - Current player ID
     */
    drawBuilding(id, data, ownerId, playerId) {
        if (!this.ctx) return;
        
        const { x, y } = this.worldToMinimap(data.x, data.z);
        
        // Determine shape and color based on building type and ownership
        let color;
        if (ownerId === playerId) {
            color = this.colors.playerBuilding;
        } else if (ownerId === 'ai') {
            color = this.colors.aiBuilding;
        } else {
            color = this.colors.enemyBuilding;
        }
        
        this.ctx.fillStyle = color;
        
        // Draw building marker (square or specific shape)
        const size = this.buildingMarkerSize;
        
        // Different shapes based on building type
        switch (data.type) {
            case 'base':
                // Draw base as a filled square
                this.ctx.fillRect(x - size, y - size, size * 2, size * 2);
                break;
                
            case 'barracks':
                // Draw barracks as a filled circle
                this.ctx.beginPath();
                this.ctx.arc(x, y, size, 0, Math.PI * 2);
                this.ctx.fill();
                break;
                
            case 'resourceGenerator':
                // Draw resource generator as a diamond
                this.ctx.beginPath();
                this.ctx.moveTo(x, y - size);
                this.ctx.lineTo(x + size, y);
                this.ctx.lineTo(x, y + size);
                this.ctx.lineTo(x - size, y);
                this.ctx.closePath();
                this.ctx.fill();
                break;
                
            case 'tower':
                // Draw tower as a triangle
                this.ctx.beginPath();
                this.ctx.moveTo(x, y - size);
                this.ctx.lineTo(x + size, y + size);
                this.ctx.lineTo(x - size, y + size);
                this.ctx.closePath();
                this.ctx.fill();
                break;
                
            default:
                // Default to square
                this.ctx.fillRect(x - size, y - size, size * 2, size * 2);
        }
        
        // Store entity for click detection
        this.entities.set(id, {
            type: 'building',
            buildingType: data.type,
            ownerId,
            x: data.x,
            z: data.z,
            minimapX: x,
            minimapY: y,
            radius: this.buildingMarkerSize
        });
    }
    
    /**
     * Draw a soldier on the minimap
     * @param {string} id - Entity ID
     * @param {object} data - Soldier data
     * @param {string} ownerId - Owner ID
     * @param {string} playerId - Current player ID
     */
    drawSoldier(id, data, ownerId, playerId) {
        if (!this.ctx) return;
        
        const { x, y } = this.worldToMinimap(data.x, data.z);
        
        // Determine color based on ownership
        let color;
        if (ownerId === playerId) {
            color = this.colors.playerSoldier;
        } else if (ownerId === 'ai') {
            color = this.colors.aiSoldier;
        } else {
            color = this.colors.enemySoldier;
        }
        
        this.ctx.fillStyle = color;
        
        // Draw soldier marker (small dot)
        const size = this.soldierMarkerSize;
        
        this.ctx.beginPath();
        this.ctx.arc(x, y, size, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Store entity for click detection
        this.entities.set(id, {
            type: 'soldier',
            soldierType: data.type,
            ownerId,
            x: data.x,
            z: data.z,
            minimapX: x,
            minimapY: y,
            radius: this.soldierMarkerSize
        });
    }
    
    /**
     * Draw the camera view frustum on the minimap
     */
    drawCameraView() {
        if (!this.ctx || !sceneManager.camera) return;
        
        const camera = sceneManager.camera;
        
        // Get camera position and direction
        const camPosition = camera.position;
        const camTarget = new THREE.Vector3();
        camera.getWorldDirection(camTarget);
        camTarget.multiplyScalar(10).add(camPosition);
        
        // Convert to minimap coordinates
        const camPos = this.worldToMinimap(camPosition.x, camPosition.z);
        const targetPos = this.worldToMinimap(camTarget.x, camTarget.z);
        
        // Draw camera position
        this.ctx.fillStyle = 'white';
        this.ctx.beginPath();
        this.ctx.arc(camPos.x, camPos.y, 3, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw camera direction
        this.ctx.strokeStyle = 'white';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(camPos.x, camPos.y);
        this.ctx.lineTo(targetPos.x, targetPos.y);
        this.ctx.stroke();
        
        // Draw view frustum
        // This is a simplified representation
        const frustumSize = 15;
        const angle = Math.atan2(targetPos.y - camPos.y, targetPos.x - camPos.x);
        
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.beginPath();
        
        // Left frustum line
        this.ctx.moveTo(camPos.x, camPos.y);
        this.ctx.lineTo(
            camPos.x + Math.cos(angle - 0.4) * frustumSize,
            camPos.y + Math.sin(angle - 0.4) * frustumSize
        );
        
        // Right frustum line
        this.ctx.moveTo(camPos.x, camPos.y);
        this.ctx.lineTo(
            camPos.x + Math.cos(angle + 0.4) * frustumSize,
            camPos.y + Math.sin(angle + 0.4) * frustumSize
        );
        
        this.ctx.stroke();
    }
    
    /**
     * Handle minimap click
     * @param {MouseEvent} event - Click event
     */
    handleClick(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        // Convert minimap coordinates to world coordinates
        const worldPos = this.minimapToWorld(x, y);
        
        console.log(`Minimap clicked at (${x}, ${y}), world: (${worldPos.x}, ${worldPos.z})`);
        
        // Emit minimap click event
        const clickEvent = new CustomEvent('minimap-click', { 
            detail: { 
                minimapX: x, 
                minimapY: y,
                worldX: worldPos.x,
                worldZ: worldPos.z
            } 
        });
        window.dispatchEvent(clickEvent);
        
        // Check if clicked on an entity
        let closestEntity = null;
        let closestDistance = Infinity;
        
        for (const [id, entity] of this.entities) {
            const dx = entity.minimapX - x;
            const dy = entity.minimapY - y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance <= entity.radius && distance < closestDistance) {
                closestEntity = entity;
                closestDistance = distance;
            }
        }
        
        if (closestEntity) {
            console.log(`Clicked on entity:`, closestEntity);
            
            // Emit entity click event
            const entityEvent = new CustomEvent('minimap-entity-click', { 
                detail: { entity: closestEntity } 
            });
            window.dispatchEvent(entityEvent);
        }
    }
    
    /**
     * Update the minimap with entities
     * @param {object} gameState - Current game state
     * @param {string} playerId - Current player ID
     */
    update(gameState, playerId) {
        if (!this.ctx) return;
        
        // Clear entities map
        this.entities.clear();
        
        // Clear the minimap
        this.clear();
        
        // Draw all entities from the game state
        if (gameState && gameState.players) {
            // Draw players
            for (const [id, player] of Object.entries(gameState.players)) {
                // Draw hero
                if (player.hero) {
                    this.drawHero(`hero_${id}`, player.hero, id, playerId);
                }
                
                // Draw buildings
                if (player.buildings) {
                    for (const [buildingId, building] of Object.entries(player.buildings)) {
                        this.drawBuilding(buildingId, building, id, playerId);
                    }
                }
                
                // Draw soldiers
                if (player.soldiers) {
                    for (const [soldierId, soldier] of Object.entries(player.soldiers)) {
                        this.drawSoldier(soldierId, soldier, id, playerId);
                    }
                }
            }
            
            // Draw AI entities
            if (gameState.aiPlayer) {
                const aiPlayer = gameState.aiPlayer;
                
                // Draw AI hero
                if (aiPlayer.hero) {
                    this.drawHero(`hero_ai`, aiPlayer.hero, 'ai', playerId);
                }
                
                // Draw AI buildings
                if (aiPlayer.buildings) {
                    for (const [buildingId, building] of Object.entries(aiPlayer.buildings)) {
                        this.drawBuilding(buildingId, building, 'ai', playerId);
                    }
                }
                
                // Draw AI soldiers
                if (aiPlayer.soldiers) {
                    for (const [soldierId, soldier] of Object.entries(aiPlayer.soldiers)) {
                        this.drawSoldier(soldierId, soldier, 'ai', playerId);
                    }
                }
            }
        }
        
        // Draw camera view
        this.drawCameraView();
    }
    
    /**
     * Dispose resources
     */
    dispose() {
        if (this.canvas) {
            this.canvas.removeEventListener('click', this.handleClick);
        }
        
        this.canvas = null;
        this.ctx = null;
        this.entities.clear();
    }
}

// Export a singleton instance
const minimapManager = new MinimapManager(); 