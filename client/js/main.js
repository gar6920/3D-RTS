/**
 * Main entry point for Conqueror's Quest client
 * Initializes and coordinates all game modules
 */

// Game state and settings
const game = {
    initialized: false,
    running: false,
    debug: false,
    serverUrl: 'ws://localhost:2567',
    currentState: null,
    playerId: null,
    lastUpdate: Date.now(),
    deltaTime: 0,
    
    // Animation frame ID
    animationFrameId: null,
    
    // Game loop callback
    update: null,
    
    // Game modules
    modules: {
        network: null,
        scene: null,
        entities: null,
        minimap: null,
        ui: null
    }
};

/**
 * Initialize the game
 * @param {object} options - Game options
 */
function initializeGame(options = {}) {
    // Already initialized
    if (game.initialized) return;
    
    console.log('Initializing game...');
    
    // Set options
    game.debug = options.debug || false;
    game.serverUrl = options.serverUrl || 'ws://localhost:2567';
    
    // Create debug console if in debug mode
    if (game.debug) {
        createDebugConsole();
    }
    
    // Show loading screen
    uiManager.showLoading('Initializing game...');
    
    // Store module references for easier access
    game.modules.network = networkManager;
    game.modules.scene = sceneManager;
    game.modules.entities = entityManager;
    game.modules.minimap = minimapManager;
    game.modules.ui = uiManager;
    
    // Initialize UI first
    console.log('Initializing UI...');
    const uiInitialized = uiManager.initialize();
    
    if (!uiInitialized) {
        console.error('Failed to initialize UI');
        uiManager.showNotification('Failed to initialize UI', 'error');
        return;
    }
    
    // Initialize Three.js scene
    console.log('Initializing 3D scene...');
    const sceneInitialized = sceneManager.initialize({
        container: document.getElementById('game-canvas-container')
    });
    
    if (!sceneInitialized) {
        console.error('Failed to initialize scene');
        uiManager.showNotification('Failed to initialize 3D scene', 'error');
        return;
    }
    
    // Initialize minimap
    console.log('Initializing minimap...');
    minimapManager.initialize();
    
    // Set up game event listeners
    setupEventListeners();
    
    // Connection to server will be handled later by the "Join Game" button
    
    // Set initialization flag
    game.initialized = true;
    
    // Hide loading screen
    uiManager.hideLoading();
    
    // Show welcome notification
    uiManager.showNotification('Welcome to Conqueror\'s Quest!', 'info', 5000);
    
    console.log('Game initialized successfully');
}

/**
 * Connect to the game server
 * @param {string} playerName - Player name
 */
async function connectToServer(playerName = '') {
    if (!game.initialized) {
        console.error('Game not initialized');
        return false;
    }
    
    // Show loading screen
    uiManager.showLoading('Connecting to server...');
    
    // Initialize network manager
    const networkInitialized = networkManager.initialize(game.serverUrl, game.debug);
    
    if (!networkInitialized) {
        console.error('Failed to initialize network');
        uiManager.showNotification('Failed to connect to server', 'error');
        uiManager.hideLoading();
        return false;
    }
    
    // Join or create game room
    const joined = await networkManager.joinOrCreate('game', { playerName });
    
    if (!joined) {
        console.error('Failed to join game room');
        uiManager.showNotification('Failed to join game', 'error');
        uiManager.hideLoading();
        return false;
    }
    
    // Get player ID
    game.playerId = networkManager.getPlayerId();
    
    // Start game loop
    startGameLoop();
    
    // Hide loading screen
    uiManager.hideLoading();
    
    // Show success notification
    uiManager.showNotification('Connected to game server!', 'success');
    uiManager.addChatMessage('Welcome to the game!', 'System', true);
    
    console.log('Connected to server successfully');
    return true;
}

/**
 * Set up game event listeners
 */
function setupEventListeners() {
    // Network events
    networkManager.on('onConnect', (data) => {
        console.log(`Connected to room with player ID: ${data.playerId}`);
    });
    
    networkManager.on('onDisconnect', (data) => {
        console.log(`Disconnected with code: ${data.code}`);
        stopGameLoop();
        uiManager.showNotification('Disconnected from server', 'error');
    });
    
    networkManager.on('onStateChange', (state) => {
        game.currentState = state;
        updateGameState(state);
    });
    
    networkManager.on('onPlayerJoin', (data) => {
        console.log(`Player joined: ${data.name}`);
        uiManager.addChatMessage(`${data.name} joined the game`, 'System', true);
    });
    
    networkManager.on('onPlayerLeave', (data) => {
        console.log(`Player left: ${data.name}`);
        uiManager.addChatMessage(`${data.name} left the game`, 'System', true);
    });
    
    networkManager.on('onError', (data) => {
        console.error('Network error:', data.message, data.error);
        uiManager.showNotification(`Network error: ${data.message}`, 'error');
    });
    
    // Scene events
    window.addEventListener('entity-clicked', (e) => {
        const entity = e.detail.entity;
        if (entity) {
            console.log('Entity clicked:', entity);
        }
    });
    
    window.addEventListener('ground-clicked', (e) => {
        const position = e.detail.position;
        console.log('Ground clicked at position:', position);
        
        // If in build mode, place building
        if (uiManager.isInBuildMode()) {
            uiManager.handleBuildPlacement(position.x, position.z);
        } else if (uiManager.selectedEntity) {
            // Check if selected entity is a hero or soldier
            const entity = uiManager.selectedEntity;
            
            if (entity.type === 'hero') {
                // Move hero
                networkManager.sendHeroMove(position.x, position.z);
            } else if (entity.type === 'soldier') {
                // Move soldier
                networkManager.sendSoldierMove(entity.id, position.x, position.z);
            }
        }
    });
    
    // Minimap events
    window.addEventListener('minimap-click', (e) => {
        const detail = e.detail;
        console.log('Minimap clicked:', detail);
        
        // Move camera to position
        sceneManager.moveCameraToPosition(detail.worldX, sceneManager.camera.position.y, detail.worldZ);
    });
    
    window.addEventListener('minimap-entity-click', (e) => {
        const entity = e.detail.entity;
        console.log('Minimap entity clicked:', entity);
        
        // Move camera to entity
        sceneManager.moveCameraToPosition(entity.x, sceneManager.camera.position.y, entity.z);
    });
    
    // UI events
    window.addEventListener('building-placed', (e) => {
        const detail = e.detail;
        console.log('Building placed:', detail);
        
        // Send build command to server
        networkManager.sendBuildingConstruction(detail.type, detail.x, detail.z);
    });
    
    window.addEventListener('soldier-recruited', (e) => {
        const detail = e.detail;
        console.log('Soldier recruited:', detail);
        
        // Send recruit command to server
        networkManager.sendSoldierRecruitment(detail.type, detail.buildingId);
    });
    
    window.addEventListener('chat-message', (e) => {
        const message = e.detail.message;
        
        // Add to local chat
        uiManager.addChatMessage(message, 'You');
        
        // Send to server
        networkManager.sendChatMessage(message);
    });
    
    // Handle window resize
    window.addEventListener('resize', () => {
        if (sceneManager) {
            sceneManager.handleResize();
        }
    });
}

/**
 * Update the game state
 * @param {object} state - New game state
 */
function updateGameState(state) {
    if (!state) return;
    
    // Update entities in scene
    updateEntities(state);
    
    // Update UI with player resources
    if (state.players && state.players[game.playerId]) {
        const player = state.players[game.playerId];
        
        // Update resources display
        if (player.resources) {
            uiManager.updateResources({
                materials: player.resources.materials || 0,
                energy: player.resources.energy || 0
            });
        }
    }
    
    // Update minimap
    minimapManager.update(state, game.playerId);
}

/**
 * Update entities based on game state
 * @param {object} state - Game state
 */
function updateEntities(state) {
    // Clear entities that no longer exist
    // This simple implementation recreates all entities on each update
    // For better performance, we could track entity IDs and only update changed ones
    entityManager.clearAllEntities();
    
    // Add player entities
    if (state.players) {
        for (const [playerId, player] of Object.entries(state.players)) {
            const isCurrentPlayer = playerId === game.playerId;
            
            // Add hero
            if (player.hero) {
                entityManager.addEntity(`hero_${playerId}`, 'hero', player.hero, 
                    isCurrentPlayer ? 'player' : 'enemy', 
                    playerId, player.name || `Player ${playerId}`);
            }
            
            // Add buildings
            if (player.buildings) {
                for (const [buildingId, building] of Object.entries(player.buildings)) {
                    entityManager.addEntity(buildingId, 'building', building, 
                        isCurrentPlayer ? 'player' : 'enemy', 
                        playerId);
                }
            }
            
            // Add soldiers
            if (player.soldiers) {
                for (const [soldierId, soldier] of Object.entries(player.soldiers)) {
                    entityManager.addEntity(soldierId, 'soldier', soldier, 
                        isCurrentPlayer ? 'player' : 'enemy', 
                        playerId);
                }
            }
        }
    }
    
    // Add AI entities
    if (state.aiPlayer) {
        const aiPlayer = state.aiPlayer;
        
        // Add AI hero
        if (aiPlayer.hero) {
            entityManager.addEntity('hero_ai', 'hero', aiPlayer.hero, 'ai', 'ai', 'AI');
        }
        
        // Add AI buildings
        if (aiPlayer.buildings) {
            for (const [buildingId, building] of Object.entries(aiPlayer.buildings)) {
                entityManager.addEntity(buildingId, 'building', building, 'ai', 'ai');
            }
        }
        
        // Add AI soldiers
        if (aiPlayer.soldiers) {
            for (const [soldierId, soldier] of Object.entries(aiPlayer.soldiers)) {
                entityManager.addEntity(soldierId, 'soldier', soldier, 'ai', 'ai');
            }
        }
    }
}

/**
 * Start the game loop
 */
function startGameLoop() {
    if (game.running) return;
    
    game.running = true;
    game.lastUpdate = Date.now();
    
    // Define game update function
    game.update = (currentTime) => {
        // Calculate delta time
        const now = Date.now();
        game.deltaTime = (now - game.lastUpdate) / 1000; // Convert to seconds
        game.lastUpdate = now;
        
        // Update scene (animations, physics, etc.)
        sceneManager.update(game.deltaTime);
        
        // Debug info
        if (game.debug) {
            updateDebugInfo();
        }
        
        // Request next frame if still running
        if (game.running) {
            game.animationFrameId = requestAnimationFrame(game.update);
        }
    };
    
    // Start the loop
    game.animationFrameId = requestAnimationFrame(game.update);
    
    console.log('Game loop started');
}

/**
 * Stop the game loop
 */
function stopGameLoop() {
    if (!game.running) return;
    
    game.running = false;
    
    // Cancel animation frame
    if (game.animationFrameId) {
        cancelAnimationFrame(game.animationFrameId);
        game.animationFrameId = null;
    }
    
    console.log('Game loop stopped');
}

/**
 * Create debug console
 */
function createDebugConsole() {
    // Create debug container
    const debugContainer = document.createElement('div');
    debugContainer.id = 'debug-console';
    debugContainer.className = 'debug-console';
    
    // Create debug content
    const debugContent = document.createElement('div');
    debugContent.id = 'debug-content';
    debugContent.className = 'debug-content';
    
    // Create FPS counter
    const fpsCounter = document.createElement('div');
    fpsCounter.id = 'fps-counter';
    fpsCounter.className = 'debug-item';
    fpsCounter.textContent = 'FPS: 0';
    
    // Create entity counter
    const entityCounter = document.createElement('div');
    entityCounter.id = 'entity-counter';
    entityCounter.className = 'debug-item';
    entityCounter.textContent = 'Entities: 0';
    
    // Create network status
    const networkStatus = document.createElement('div');
    networkStatus.id = 'network-status';
    networkStatus.className = 'debug-item';
    networkStatus.textContent = 'Network: Disconnected';
    
    // Add items to debug content
    debugContent.appendChild(fpsCounter);
    debugContent.appendChild(entityCounter);
    debugContent.appendChild(networkStatus);
    
    // Add debug content to container
    debugContainer.appendChild(debugContent);
    
    // Add container to document
    document.body.appendChild(debugContainer);
    
    console.log('Debug console created');
}

/**
 * Update debug information
 */
function updateDebugInfo() {
    // Update FPS counter
    const fpsCounter = document.getElementById('fps-counter');
    if (fpsCounter) {
        const fps = Math.round(1 / game.deltaTime);
        fpsCounter.textContent = `FPS: ${fps}`;
    }
    
    // Update entity counter
    const entityCounter = document.getElementById('entity-counter');
    if (entityCounter) {
        const count = entityManager ? entityManager.getEntityCount() : 0;
        entityCounter.textContent = `Entities: ${count}`;
    }
    
    // Update network status
    const networkStatus = document.getElementById('network-status');
    if (networkStatus) {
        const connected = networkManager && networkManager.isConnected();
        networkStatus.textContent = `Network: ${connected ? 'Connected' : 'Disconnected'}`;
        networkStatus.className = `debug-item ${connected ? 'connected' : 'disconnected'}`;
    }
}

/**
 * Handle login form submission
 * @param {Event} event - Form submission event
 */
async function handleLoginSubmit(event) {
    event.preventDefault();
    
    const nameInput = document.getElementById('player-name');
    const playerName = nameInput ? nameInput.value.trim() : '';
    
    if (!playerName) {
        uiManager.showNotification('Please enter a name', 'warning');
        return;
    }
    
    // Show login overlay
    const loginOverlay = document.getElementById('login-overlay');
    if (loginOverlay) {
        loginOverlay.classList.add('connecting');
        const statusEl = loginOverlay.querySelector('.connection-status');
        if (statusEl) {
            statusEl.textContent = 'Connecting...';
        }
    }
    
    // Connect to server
    const connected = await connectToServer(playerName);
    
    if (connected) {
        // Hide login overlay
        if (loginOverlay) {
            loginOverlay.style.display = 'none';
        }
    } else {
        // Show error and reset login overlay
        if (loginOverlay) {
            loginOverlay.classList.remove('connecting');
            const statusEl = loginOverlay.querySelector('.connection-status');
            if (statusEl) {
                statusEl.textContent = 'Connection failed. Try again.';
            }
        }
    }
}

/**
 * Handle disconnect button
 */
function handleDisconnect() {
    // Stop game loop
    stopGameLoop();
    
    // Disconnect from server
    if (networkManager) {
        networkManager.disconnect();
    }
    
    // Show login overlay
    const loginOverlay = document.getElementById('login-overlay');
    if (loginOverlay) {
        loginOverlay.style.display = 'flex';
        loginOverlay.classList.remove('connecting');
        const statusEl = loginOverlay.querySelector('.connection-status');
        if (statusEl) {
            statusEl.textContent = '';
        }
    }
    
    // Show notification
    uiManager.showNotification('Disconnected from game', 'info');
}

/**
 * Initialize the game when DOM is loaded
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing game...');
    
    // Initialize game
    initializeGame({
        debug: window.location.search.includes('debug=true'),
        serverUrl: 'ws://localhost:2567'
    });
    
    // Set up login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLoginSubmit);
    }
    
    // Set up disconnect button
    const disconnectBtn = document.getElementById('disconnect-btn');
    if (disconnectBtn) {
        disconnectBtn.addEventListener('click', handleDisconnect);
    }
});

// Expose game object for debugging
window.game = game; 