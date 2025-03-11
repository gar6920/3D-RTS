/**
 * Game entity rendering for Conqueror's Quest
 * Handles rendering of heroes, buildings, and soldiers
 */

class EntityManager {
    constructor() {
        this.entities = new Map();
        this.entityModels = {
            hero: null,
            building: {
                base: null,
                barracks: null,
                resourceGenerator: null,
                tower: null
            },
            soldier: {
                infantry: null,
                archer: null,
                cavalry: null
            }
        };
        
        // Materials for different entity types
        this.materials = {
            hero: new THREE.MeshStandardMaterial({ 
                color: 0x2288ff,
                roughness: 0.7,
                metalness: 0.3
            }),
            building: {
                base: new THREE.MeshStandardMaterial({ 
                    color: 0x8866aa,
                    roughness: 0.8,
                    metalness: 0.2
                }),
                barracks: new THREE.MeshStandardMaterial({ 
                    color: 0xaa6644,
                    roughness: 0.8,
                    metalness: 0.2
                }),
                resourceGenerator: new THREE.MeshStandardMaterial({ 
                    color: 0x44aa66,
                    roughness: 0.6,
                    metalness: 0.4
                }),
                tower: new THREE.MeshStandardMaterial({ 
                    color: 0xaaaa44,
                    roughness: 0.7,
                    metalness: 0.3
                })
            },
            soldier: {
                infantry: new THREE.MeshStandardMaterial({ 
                    color: 0x2266aa,
                    roughness: 0.7,
                    metalness: 0.3
                }),
                archer: new THREE.MeshStandardMaterial({ 
                    color: 0x22aa66,
                    roughness: 0.7,
                    metalness: 0.3
                }),
                cavalry: new THREE.MeshStandardMaterial({ 
                    color: 0xaa6622,
                    roughness: 0.7,
                    metalness: 0.3
                })
            },
            enemyTint: new THREE.Color(0xff6666) // Red tint for enemy entities
        };
        
        // Load all entity models
        this.loadModels();
    }
    
    /**
     * Load all entity models
     */
    loadModels() {
        // For now, we'll use simple geometries
        // In a real game, you'd load actual 3D models
        
        // Hero model (sphere)
        const heroGeometry = new THREE.SphereGeometry(0.5, 16, 16);
        this.entityModels.hero = heroGeometry;
        
        // Building models
        const baseGeometry = new THREE.BoxGeometry(4, 2, 4);
        const barracksGeometry = new THREE.BoxGeometry(3, 1.5, 3);
        const resourceGenGeometry = new THREE.CylinderGeometry(1, 1.5, 2, 8);
        const towerGeometry = new THREE.CylinderGeometry(0.5, 1, 3, 8);
        
        this.entityModels.building.base = baseGeometry;
        this.entityModels.building.barracks = barracksGeometry;
        this.entityModels.building.resourceGenerator = resourceGenGeometry;
        this.entityModels.building.tower = towerGeometry;
        
        // Soldier models
        const infantryGeometry = new THREE.BoxGeometry(0.3, 0.8, 0.3);
        const archerGeometry = new THREE.ConeGeometry(0.3, 0.8, 8);
        const cavalryGeometry = new THREE.BoxGeometry(0.6, 0.5, 0.8);
        
        this.entityModels.soldier.infantry = infantryGeometry;
        this.entityModels.soldier.archer = archerGeometry;
        this.entityModels.soldier.cavalry = cavalryGeometry;
    }
    
    /**
     * Create a hero entity
     * @param {string} id - Entity ID
     * @param {object} data - Hero data from server
     * @param {boolean} isEnemy - Whether this hero belongs to an enemy
     * @returns {THREE.Object3D} - The created hero mesh
     */
    createHero(id, data, isEnemy = false) {
        const material = this.materials.hero.clone();
        
        if (isEnemy) {
            material.color.multiply(this.materials.enemyTint);
        }
        
        const mesh = new THREE.Mesh(this.entityModels.hero, material);
        
        // Set position
        mesh.position.set(data.x, data.y, data.z);
        
        // Set up shadow
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        // Store metadata
        mesh.userData.entityId = id;
        mesh.userData.entityType = 'hero';
        mesh.userData.ownerId = data.ownerId;
        mesh.userData.isEnemy = isEnemy;
        
        return mesh;
    }
    
    /**
     * Create a building entity
     * @param {string} id - Entity ID
     * @param {object} data - Building data from server
     * @param {boolean} isEnemy - Whether this building belongs to an enemy
     * @returns {THREE.Object3D} - The created building mesh
     */
    createBuilding(id, data, isEnemy = false) {
        const buildingType = data.type;
        const geometry = this.entityModels.building[buildingType];
        const material = this.materials.building[buildingType].clone();
        
        if (isEnemy) {
            material.color.multiply(this.materials.enemyTint);
        }
        
        const mesh = new THREE.Mesh(geometry, material);
        
        // Set position
        mesh.position.set(data.x, data.y + (data.height / 2), data.z);
        
        // Set up shadow
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        // Store metadata
        mesh.userData.entityId = id;
        mesh.userData.entityType = 'building';
        mesh.userData.buildingType = buildingType;
        mesh.userData.ownerId = data.ownerId;
        mesh.userData.isEnemy = isEnemy;
        
        return mesh;
    }
    
    /**
     * Create a soldier entity
     * @param {string} id - Entity ID
     * @param {object} data - Soldier data from server
     * @param {boolean} isEnemy - Whether this soldier belongs to an enemy
     * @returns {THREE.Object3D} - The created soldier mesh
     */
    createSoldier(id, data, isEnemy = false) {
        const soldierType = data.type;
        const geometry = this.entityModels.soldier[soldierType];
        const material = this.materials.soldier[soldierType].clone();
        
        if (isEnemy) {
            material.color.multiply(this.materials.enemyTint);
        }
        
        const mesh = new THREE.Mesh(geometry, material);
        
        // Set position
        mesh.position.set(data.x, data.y + 0.4, data.z);
        
        // Set up shadow
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        // Store metadata
        mesh.userData.entityId = id;
        mesh.userData.entityType = 'soldier';
        mesh.userData.soldierType = soldierType;
        mesh.userData.ownerId = data.ownerId;
        mesh.userData.isEnemy = isEnemy;
        
        return mesh;
    }
    
    /**
     * Add entity to the scene
     * @param {string} id - Entity ID
     * @param {object} data - Entity data
     * @param {string} type - Entity type (hero, building, soldier)
     * @param {string} ownerId - ID of the entity owner
     * @param {string} currentPlayerId - ID of the current player
     */
    addEntity(id, data, type, ownerId, currentPlayerId) {
        // Check if entity already exists
        if (this.entities.has(id)) {
            console.warn(`Entity with ID ${id} already exists`);
            return;
        }
        
        // Determine if this is an enemy entity
        const isEnemy = ownerId !== currentPlayerId;
        
        // Create entity based on type
        let mesh;
        switch (type) {
            case 'hero':
                mesh = this.createHero(id, data, isEnemy);
                break;
                
            case 'building':
                mesh = this.createBuilding(id, data, isEnemy);
                break;
                
            case 'soldier':
                mesh = this.createSoldier(id, data, isEnemy);
                break;
                
            default:
                console.error(`Unknown entity type: ${type}`);
                return;
        }
        
        // Add entity to the scene
        sceneManager.entitiesContainer.add(mesh);
        
        // Store entity reference
        this.entities.set(id, {
            mesh,
            type,
            ownerId,
            data: { ...data }
        });
        
        console.log(`Added ${type} entity with ID ${id}`);
    }
    
    /**
     * Update entity from server data
     * @param {string} id - Entity ID
     * @param {object} data - Entity data
     */
    updateEntity(id, data) {
        const entity = this.entities.get(id);
        if (!entity) {
            //console.warn(`Cannot update entity with ID ${id}, it doesn't exist`);
            return;
        }
        
        // Update position
        if (data.x !== undefined && data.y !== undefined && data.z !== undefined) {
            entity.mesh.position.set(data.x, data.y, data.z);
            
            // For buildings, adjust y position based on height
            if (entity.type === 'building' && data.height) {
                entity.mesh.position.y = data.y + (data.height / 2);
            }
            
            // For soldiers, add small offset to y
            if (entity.type === 'soldier') {
                entity.mesh.position.y = data.y + 0.4;
            }
        }
        
        // Update rotation (if applicable)
        if (data.rotation !== undefined) {
            entity.mesh.rotation.y = data.rotation;
        }
        
        // Update health indicator (if applicable)
        if (data.health !== undefined && data.maxHealth !== undefined) {
            // TODO: Implement health bar or indicator
        }
        
        // Store updated data
        entity.data = { ...entity.data, ...data };
    }
    
    /**
     * Remove entity from the scene
     * @param {string} id - Entity ID
     */
    removeEntity(id) {
        const entity = this.entities.get(id);
        if (!entity) {
            console.warn(`Cannot remove entity with ID ${id}, it doesn't exist`);
            return;
        }
        
        // Remove from scene
        sceneManager.entitiesContainer.remove(entity.mesh);
        
        // Dispose of resources
        if (entity.mesh.geometry) {
            entity.mesh.geometry.dispose();
        }
        
        if (entity.mesh.material) {
            if (Array.isArray(entity.mesh.material)) {
                entity.mesh.material.forEach(material => material.dispose());
            } else {
                entity.mesh.material.dispose();
            }
        }
        
        // Remove from entities map
        this.entities.delete(id);
        
        console.log(`Removed entity with ID ${id}`);
    }
    
    /**
     * Clear all entities from the scene
     */
    clearAllEntities() {
        for (const [id, entity] of this.entities) {
            sceneManager.entitiesContainer.remove(entity.mesh);
            
            // Dispose of resources
            if (entity.mesh.geometry) {
                entity.mesh.geometry.dispose();
            }
            
            if (entity.mesh.material) {
                if (Array.isArray(entity.mesh.material)) {
                    entity.mesh.material.forEach(material => material.dispose());
                } else {
                    entity.mesh.material.dispose();
                }
            }
        }
        
        this.entities.clear();
        console.log('Cleared all entities');
    }
}

// Export a singleton instance
const entityManager = new EntityManager(); 