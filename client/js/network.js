/**
 * Network manager for Conqueror's Quest
 * Handles Colyseus client connection and game state synchronization
 */

class NetworkManager {
    constructor() {
        // Colyseus client
        this.client = null;
        
        // Current room connection
        this.room = null;
        
        // Player ID
        this.playerId = null;
        
        // Connection status
        this.connected = false;
        
        // Event callbacks
        this.callbacks = {
            onConnect: [],
            onDisconnect: [],
            onStateChange: [],
            onError: [],
            onPlayerJoin: [],
            onPlayerLeave: [],
            onMessage: []
        };
        
        // Debug mode
        this.debug = false;
    }
    
    /**
     * Initialize the network manager
     * @param {string} serverUrl - Server URL, defaults to localhost
     * @param {boolean} debug - Enable debug mode
     */
    initialize(serverUrl = 'ws://localhost:2567', debug = false) {
        // Set debug mode
        this.debug = debug;
        
        if (debug) {
            console.log('Initializing NetworkManager with server:', serverUrl);
        }
        
        try {
            // Create Colyseus client
            this.client = new Colyseus.Client(serverUrl);
            
            console.log('Colyseus client created');
            
            return true;
        } catch (error) {
            console.error('Failed to create Colyseus client:', error);
            this._triggerCallbacks('onError', { message: 'Failed to create Colyseus client', error });
            return false;
        }
    }
    
    /**
     * Join or create a game room
     * @param {string} roomName - Room name
     * @param {object} options - Room options
     * @returns {Promise} - Promise that resolves when connected to room
     */
    async joinOrCreate(roomName = 'game', options = {}) {
        if (!this.client) {
            console.error('Colyseus client not initialized');
            this._triggerCallbacks('onError', { message: 'Colyseus client not initialized' });
            return false;
        }
        
        try {
            if (this.debug) {
                console.log(`Joining or creating room: ${roomName}`, options);
            }
            
            // Join or create room
            this.room = await this.client.joinOrCreate(roomName, options);
            
            // Set player ID
            this.playerId = this.room.sessionId;
            
            // Set connection status
            this.connected = true;
            
            console.log(`Connected to room: ${roomName} with player ID: ${this.playerId}`);
            
            // Set up room event listeners
            this._setupRoomListeners();
            
            // Trigger connect callbacks
            this._triggerCallbacks('onConnect', { roomName, playerId: this.playerId });
            
            return true;
        } catch (error) {
            console.error('Failed to join or create room:', error);
            this._triggerCallbacks('onError', { message: 'Failed to join or create room', error });
            return false;
        }
    }
    
    /**
     * Set up room event listeners
     * @private
     */
    _setupRoomListeners() {
        if (!this.room) return;
        
        // State change
        this.room.onStateChange((state) => {
            if (this.debug) {
                console.log('State changed:', state);
            }
            
            this._triggerCallbacks('onStateChange', state);
        });
        
        // Player join
        this.room.onMessage('playerJoin', (message) => {
            console.log('Player joined:', message);
            this._triggerCallbacks('onPlayerJoin', message);
        });
        
        // Player leave
        this.room.onMessage('playerLeave', (message) => {
            console.log('Player left:', message);
            this._triggerCallbacks('onPlayerLeave', message);
        });
        
        // Error
        this.room.onError((error) => {
            console.error('Room error:', error);
            this._triggerCallbacks('onError', { message: 'Room error', error });
        });
        
        // Leave
        this.room.onLeave((code) => {
            console.log(`Left room with code: ${code}`);
            this.connected = false;
            this._triggerCallbacks('onDisconnect', { code });
            
            // Clear room reference
            this.room = null;
        });
        
        // Generic message
        this.room.onMessage('*', (type, message) => {
            if (this.debug) {
                console.log(`Received message of type: ${type}`, message);
            }
            
            this._triggerCallbacks('onMessage', { type, message });
        });
    }
    
    /**
     * Send a message to the server
     * @param {string} type - Message type
     * @param {object} data - Message data
     */
    send(type, data = {}) {
        if (!this.room || !this.connected) {
            console.error('Not connected to room');
            return false;
        }
        
        try {
            if (this.debug) {
                console.log(`Sending message of type: ${type}`, data);
            }
            
            this.room.send(type, data);
            return true;
        } catch (error) {
            console.error('Failed to send message:', error);
            this._triggerCallbacks('onError', { message: 'Failed to send message', error });
            return false;
        }
    }
    
    /**
     * Send a hero movement command
     * @param {number} x - Target X coordinate
     * @param {number} z - Target Z coordinate
     */
    sendHeroMove(x, z) {
        return this.send('hero-move', { x, z });
    }
    
    /**
     * Send a building construction command
     * @param {string} type - Building type
     * @param {number} x - Position X coordinate
     * @param {number} z - Position Z coordinate
     */
    sendBuildingConstruction(type, x, z) {
        return this.send('build', { type, x, z });
    }
    
    /**
     * Send a soldier recruitment command
     * @param {string} type - Soldier type
     * @param {string} buildingId - Source building ID
     */
    sendSoldierRecruitment(type, buildingId) {
        return this.send('recruit', { type, buildingId });
    }
    
    /**
     * Send a soldier movement command
     * @param {string} soldierId - Soldier ID
     * @param {number} x - Target X coordinate
     * @param {number} z - Target Z coordinate
     */
    sendSoldierMove(soldierId, x, z) {
        return this.send('soldier-move', { soldierId, x, z });
    }
    
    /**
     * Send a chat message
     * @param {string} message - Chat message
     */
    sendChatMessage(message) {
        return this.send('chat', { message });
    }
    
    /**
     * Register callback for event
     * @param {string} event - Event name
     * @param {function} callback - Callback function
     */
    on(event, callback) {
        if (!this.callbacks[event]) {
            console.warn(`Unknown event: ${event}`);
            return false;
        }
        
        this.callbacks[event].push(callback);
        return true;
    }
    
    /**
     * Remove callback for event
     * @param {string} event - Event name
     * @param {function} callback - Callback function
     */
    off(event, callback) {
        if (!this.callbacks[event]) {
            console.warn(`Unknown event: ${event}`);
            return false;
        }
        
        const index = this.callbacks[event].indexOf(callback);
        if (index !== -1) {
            this.callbacks[event].splice(index, 1);
            return true;
        }
        
        return false;
    }
    
    /**
     * Trigger callbacks for event
     * @param {string} event - Event name
     * @param {object} data - Event data
     * @private
     */
    _triggerCallbacks(event, data) {
        if (!this.callbacks[event]) {
            return;
        }
        
        for (const callback of this.callbacks[event]) {
            try {
                callback(data);
            } catch (error) {
                console.error(`Error in ${event} callback:`, error);
            }
        }
    }
    
    /**
     * Leave the current room
     */
    leave() {
        if (this.room) {
            console.log('Leaving room');
            this.room.leave();
            this.room = null;
            this.connected = false;
        }
    }
    
    /**
     * Disconnect from the server
     */
    disconnect() {
        this.leave();
        
        if (this.client) {
            console.log('Disconnecting from server');
            // The Colyseus client does not have a disconnect method,
            // but we can clear our references
            this.client = null;
        }
    }
    
    /**
     * Dispose resources
     */
    dispose() {
        this.disconnect();
        
        // Clear callbacks
        for (const event in this.callbacks) {
            this.callbacks[event] = [];
        }
    }
    
    /**
     * Check if connected to room
     * @returns {boolean} - Connected status
     */
    isConnected() {
        return this.connected && this.room !== null;
    }
    
    /**
     * Get current game state
     * @returns {object|null} - Current game state or null if not connected
     */
    getState() {
        if (this.room) {
            return this.room.state;
        }
        
        return null;
    }
    
    /**
     * Get player ID
     * @returns {string|null} - Player ID or null if not connected
     */
    getPlayerId() {
        return this.playerId;
    }
}

// Export a singleton instance
const networkManager = new NetworkManager(); 