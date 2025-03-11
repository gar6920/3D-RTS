/**
 * UI Manager for Conqueror's Quest
 * Handles game interface elements like selection panel, command panel, and resources display
 */

class UIManager {
    constructor() {
        // UI elements
        this.elements = {
            root: null,
            resourcesPanel: null,
            selectionPanel: null,
            commandPanel: null,
            minimapContainer: null,
            chatPanel: null,
            notificationArea: null,
            loading: null
        };
        
        // Currently selected entity
        this.selectedEntity = null;
        
        // Active build mode
        this.buildMode = {
            active: false,
            type: null
        };
        
        // Resource display values
        this.resources = {
            materials: 0,
            energy: 0
        };
        
        // Bind methods to maintain 'this' context
        this.handleEntitySelect = this.handleEntitySelect.bind(this);
        this.handleBuildButtonClick = this.handleBuildButtonClick.bind(this);
        this.handleRecruitButtonClick = this.handleRecruitButtonClick.bind(this);
        this.handleChatSubmit = this.handleChatSubmit.bind(this);
    }
    
    /**
     * Initialize the UI manager
     */
    initialize() {
        // Get UI root element
        this.elements.root = document.getElementById('game-ui');
        
        if (!this.elements.root) {
            console.error('UI root element not found');
            return false;
        }
        
        // Get other UI elements
        this.elements.resourcesPanel = document.getElementById('resources-panel');
        this.elements.selectionPanel = document.getElementById('selection-panel');
        this.elements.commandPanel = document.getElementById('command-panel');
        this.elements.minimapContainer = document.getElementById('minimap-container');
        this.elements.chatPanel = document.getElementById('chat-panel');
        this.elements.notificationArea = document.getElementById('notification-area');
        this.elements.loading = document.getElementById('loading-screen');
        
        // Check for required elements
        if (!this.elements.resourcesPanel || 
            !this.elements.selectionPanel || 
            !this.elements.commandPanel || 
            !this.elements.minimapContainer) {
            console.error('Required UI elements not found');
            return false;
        }
        
        // Set up event listeners
        this._setupEventListeners();
        
        console.log('UI Manager initialized');
        return true;
    }
    
    /**
     * Set up event listeners
     * @private
     */
    _setupEventListeners() {
        // Listen for entity selection
        window.addEventListener('entity-selected', this.handleEntitySelect);
        
        // Command panel button listeners
        const buildButtons = document.querySelectorAll('.build-button');
        buildButtons.forEach(button => {
            button.addEventListener('click', this.handleBuildButtonClick);
        });
        
        const recruitButtons = document.querySelectorAll('.recruit-button');
        recruitButtons.forEach(button => {
            button.addEventListener('click', this.handleRecruitButtonClick);
        });
        
        // Chat form submission
        const chatForm = document.getElementById('chat-form');
        if (chatForm) {
            chatForm.addEventListener('submit', this.handleChatSubmit);
        }
        
        // Cancel build mode when escape is pressed
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.buildMode.active) {
                this.cancelBuildMode();
            }
        });
    }
    
    /**
     * Handle entity selection event
     * @param {CustomEvent} event - Entity selection event
     */
    handleEntitySelect(event) {
        const entity = event.detail.entity;
        this.selectedEntity = entity;
        
        if (this.buildMode.active) {
            this.cancelBuildMode();
        }
        
        this.updateSelectionPanel();
        this.updateCommandPanel();
    }
    
    /**
     * Update the selection panel with selected entity information
     */
    updateSelectionPanel() {
        const panel = this.elements.selectionPanel;
        
        // Clear panel
        panel.innerHTML = '';
        
        if (!this.selectedEntity) {
            panel.innerHTML = '<div class="no-selection">No selection</div>';
            return;
        }
        
        // Create selection info based on entity type
        const entity = this.selectedEntity;
        
        let html = `
            <div class="selection-header ${entity.type}-header">
                <h3>${this._formatEntityName(entity)}</h3>
            </div>
            <div class="selection-properties">
        `;
        
        // Add properties based on entity type
        switch (entity.type) {
            case 'hero':
                html += `
                    <div class="property">
                        <label>Health:</label>
                        <div class="progress-bar">
                            <div class="progress" style="width: ${(entity.health / entity.maxHealth) * 100}%"></div>
                            <span>${entity.health} / ${entity.maxHealth}</span>
                        </div>
                    </div>
                    <div class="property">
                        <label>Level:</label>
                        <span>${entity.level || 1}</span>
                    </div>
                `;
                break;
                
            case 'building':
                html += `
                    <div class="property">
                        <label>Type:</label>
                        <span>${this._formatBuildingType(entity.buildingType)}</span>
                    </div>
                    <div class="property">
                        <label>Health:</label>
                        <div class="progress-bar">
                            <div class="progress" style="width: ${(entity.health / entity.maxHealth) * 100}%"></div>
                            <span>${entity.health} / ${entity.maxHealth}</span>
                        </div>
                    </div>
                `;
                
                // Add resource output for resource generators
                if (entity.buildingType === 'resourceGenerator') {
                    html += `
                        <div class="property">
                            <label>Output:</label>
                            <span>${entity.output || 5} ${entity.resourceType || 'materials'}/min</span>
                        </div>
                    `;
                }
                break;
                
            case 'soldier':
                html += `
                    <div class="property">
                        <label>Type:</label>
                        <span>${this._formatSoldierType(entity.soldierType)}</span>
                    </div>
                    <div class="property">
                        <label>Health:</label>
                        <div class="progress-bar">
                            <div class="progress" style="width: ${(entity.health / entity.maxHealth) * 100}%"></div>
                            <span>${entity.health} / ${entity.maxHealth}</span>
                        </div>
                    </div>
                    <div class="property">
                        <label>Attack:</label>
                        <span>${entity.attack || 10}</span>
                    </div>
                `;
                break;
                
            default:
                html += `
                    <div class="property">
                        <label>Type:</label>
                        <span>${entity.type}</span>
                    </div>
                `;
        }
        
        html += `</div>`;
        
        panel.innerHTML = html;
    }
    
    /**
     * Update the command panel based on the selected entity
     */
    updateCommandPanel() {
        const panel = this.elements.commandPanel;
        
        // Clear panel
        panel.innerHTML = '';
        
        if (!this.selectedEntity) {
            return;
        }
        
        const entity = this.selectedEntity;
        let html = '';
        
        // Generate command buttons based on entity type
        switch (entity.type) {
            case 'hero':
                // Hero commands
                html += `
                    <div class="command-section">
                        <h4>Build</h4>
                        <div class="command-buttons">
                            <button class="build-button" data-type="base">Base (100 M)</button>
                            <button class="build-button" data-type="barracks">Barracks (50 M)</button>
                            <button class="build-button" data-type="resourceGenerator">Resource Gen (75 M)</button>
                            <button class="build-button" data-type="tower">Tower (60 M)</button>
                        </div>
                    </div>
                `;
                break;
                
            case 'building':
                // Building commands
                if (entity.buildingType === 'barracks') {
                    html += `
                        <div class="command-section">
                            <h4>Recruit</h4>
                            <div class="command-buttons">
                                <button class="recruit-button" data-type="infantry">Infantry (20 M)</button>
                                <button class="recruit-button" data-type="archer">Archer (25 M)</button>
                                <button class="recruit-button" data-type="cavalry">Cavalry (40 M)</button>
                            </div>
                        </div>
                    `;
                } else if (entity.buildingType === 'base') {
                    html += `
                        <div class="command-section">
                            <h4>Base Actions</h4>
                            <div class="command-buttons">
                                <button class="base-button" data-action="upgrade">Upgrade (100 M)</button>
                            </div>
                        </div>
                    `;
                }
                break;
                
            case 'soldier':
                // Soldier commands - typically movement only, handled by scene manager
                html += `
                    <div class="command-section">
                        <h4>Actions</h4>
                        <div class="info-text">
                            Click on map to move soldier
                        </div>
                    </div>
                `;
                break;
        }
        
        panel.innerHTML = html;
        
        // Re-add event listeners to new buttons
        const buildButtons = panel.querySelectorAll('.build-button');
        buildButtons.forEach(button => {
            button.addEventListener('click', this.handleBuildButtonClick);
        });
        
        const recruitButtons = panel.querySelectorAll('.recruit-button');
        recruitButtons.forEach(button => {
            button.addEventListener('click', this.handleRecruitButtonClick);
        });
    }
    
    /**
     * Format entity name for display
     * @param {object} entity - Entity object
     * @returns {string} - Formatted name
     * @private
     */
    _formatEntityName(entity) {
        switch (entity.type) {
            case 'hero':
                return `Hero ${entity.name || ''}`;
            case 'building':
                return this._formatBuildingType(entity.buildingType);
            case 'soldier':
                return this._formatSoldierType(entity.soldierType);
            default:
                return entity.type;
        }
    }
    
    /**
     * Format building type for display
     * @param {string} type - Building type
     * @returns {string} - Formatted building type
     * @private
     */
    _formatBuildingType(type) {
        switch (type) {
            case 'base':
                return 'Command Base';
            case 'barracks':
                return 'Barracks';
            case 'resourceGenerator':
                return 'Resource Generator';
            case 'tower':
                return 'Defense Tower';
            default:
                return type;
        }
    }
    
    /**
     * Format soldier type for display
     * @param {string} type - Soldier type
     * @returns {string} - Formatted soldier type
     * @private
     */
    _formatSoldierType(type) {
        switch (type) {
            case 'infantry':
                return 'Infantry';
            case 'archer':
                return 'Archer';
            case 'cavalry':
                return 'Cavalry';
            default:
                return type;
        }
    }
    
    /**
     * Handle build button click
     * @param {Event} event - Click event
     */
    handleBuildButtonClick(event) {
        const buildingType = event.target.dataset.type;
        
        // Check if we have enough resources
        let cost = 0;
        switch (buildingType) {
            case 'base':
                cost = 100;
                break;
            case 'barracks':
                cost = 50;
                break;
            case 'resourceGenerator':
                cost = 75;
                break;
            case 'tower':
                cost = 60;
                break;
        }
        
        if (this.resources.materials < cost) {
            this.showNotification('Not enough materials!', 'error');
            return;
        }
        
        // Enter build mode
        this.buildMode = {
            active: true,
            type: buildingType,
            cost: cost
        };
        
        // Show build mode UI
        this.showNotification(`Select location to build ${this._formatBuildingType(buildingType)}`, 'info');
        
        // Publish event for scene manager
        const event = new CustomEvent('build-mode-activated', {
            detail: { buildingType }
        });
        window.dispatchEvent(event);
    }
    
    /**
     * Cancel build mode
     */
    cancelBuildMode() {
        if (!this.buildMode.active) return;
        
        this.buildMode = {
            active: false,
            type: null
        };
        
        this.showNotification('Build mode canceled', 'info');
        
        // Publish event for scene manager
        const event = new CustomEvent('build-mode-canceled');
        window.dispatchEvent(event);
    }
    
    /**
     * Handle build placement
     * @param {number} x - World X coordinate
     * @param {number} z - World Z coordinate
     */
    handleBuildPlacement(x, z) {
        if (!this.buildMode.active) return;
        
        // Publish event for network manager
        const event = new CustomEvent('building-placed', {
            detail: {
                type: this.buildMode.type,
                x,
                z,
                cost: this.buildMode.cost
            }
        });
        window.dispatchEvent(event);
        
        // Exit build mode
        this.buildMode = {
            active: false,
            type: null
        };
    }
    
    /**
     * Handle recruit button click
     * @param {Event} event - Click event
     */
    handleRecruitButtonClick(event) {
        const soldierType = event.target.dataset.type;
        
        // Check if we have enough resources
        let cost = 0;
        switch (soldierType) {
            case 'infantry':
                cost = 20;
                break;
            case 'archer':
                cost = 25;
                break;
            case 'cavalry':
                cost = 40;
                break;
        }
        
        if (this.resources.materials < cost) {
            this.showNotification('Not enough materials!', 'error');
            return;
        }
        
        // Publish event for network manager
        const event = new CustomEvent('soldier-recruited', {
            detail: {
                type: soldierType,
                buildingId: this.selectedEntity.id,
                cost: cost
            }
        });
        window.dispatchEvent(event);
        
        this.showNotification(`Recruiting ${this._formatSoldierType(soldierType)}`, 'success');
    }
    
    /**
     * Handle chat form submission
     * @param {Event} event - Form submission event
     */
    handleChatSubmit(event) {
        event.preventDefault();
        
        const input = document.getElementById('chat-input');
        if (!input || !input.value.trim()) return;
        
        const message = input.value.trim();
        
        // Clear input
        input.value = '';
        
        // Publish event for network manager
        const event = new CustomEvent('chat-message', {
            detail: { message }
        });
        window.dispatchEvent(event);
    }
    
    /**
     * Add chat message to chat panel
     * @param {string} message - Chat message
     * @param {string} sender - Message sender
     * @param {boolean} isSystem - Whether this is a system message
     */
    addChatMessage(message, sender = 'System', isSystem = false) {
        const chatMessages = document.getElementById('chat-messages');
        if (!chatMessages) return;
        
        const msgEl = document.createElement('div');
        msgEl.className = isSystem ? 'chat-message system' : 'chat-message';
        
        msgEl.innerHTML = `
            <span class="sender">${sender}:</span>
            <span class="message">${message}</span>
        `;
        
        chatMessages.appendChild(msgEl);
        
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    /**
     * Update resources display
     * @param {object} resources - Resources object with materials and energy
     */
    updateResources(resources) {
        this.resources = resources;
        
        const materialsEl = document.getElementById('materials-value');
        const energyEl = document.getElementById('energy-value');
        
        if (materialsEl) {
            materialsEl.textContent = resources.materials;
        }
        
        if (energyEl) {
            energyEl.textContent = resources.energy;
        }
    }
    
    /**
     * Show a notification
     * @param {string} message - Notification message
     * @param {string} type - Notification type (info, success, warning, error)
     * @param {number} duration - Duration in milliseconds
     */
    showNotification(message, type = 'info', duration = 3000) {
        if (!this.elements.notificationArea) return;
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        this.elements.notificationArea.appendChild(notification);
        
        // Remove after duration
        setTimeout(() => {
            notification.classList.add('fade-out');
            
            // Remove from DOM after fade animation
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);
    }
    
    /**
     * Show loading screen
     * @param {string} message - Loading message
     */
    showLoading(message = 'Loading...') {
        if (!this.elements.loading) return;
        
        const messageEl = this.elements.loading.querySelector('.loading-message');
        if (messageEl) {
            messageEl.textContent = message;
        }
        
        this.elements.loading.style.display = 'flex';
    }
    
    /**
     * Hide loading screen
     */
    hideLoading() {
        if (!this.elements.loading) return;
        
        this.elements.loading.style.display = 'none';
    }
    
    /**
     * Deselect current entity
     */
    deselectEntity() {
        this.selectedEntity = null;
        this.updateSelectionPanel();
        this.updateCommandPanel();
    }
    
    /**
     * Check if in build mode
     * @returns {boolean} - Whether in build mode
     */
    isInBuildMode() {
        return this.buildMode.active;
    }
    
    /**
     * Get current build mode info
     * @returns {object} - Build mode info
     */
    getBuildMode() {
        return this.buildMode;
    }
    
    /**
     * Dispose resources
     */
    dispose() {
        // Remove event listeners
        window.removeEventListener('entity-selected', this.handleEntitySelect);
        
        const chatForm = document.getElementById('chat-form');
        if (chatForm) {
            chatForm.removeEventListener('submit', this.handleChatSubmit);
        }
        
        // Reset properties
        this.selectedEntity = null;
        this.buildMode = {
            active: false,
            type: null
        };
    }
}

// Export a singleton instance
const uiManager = new UIManager(); 