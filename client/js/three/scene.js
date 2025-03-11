/**
 * Scene management for Conqueror's Quest
 * Handles Three.js scene setup, camera, and renderer
 */

class SceneManager {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.lights = [];
        this.ground = null;
        this.entitiesContainer = null;
        this.isInitialized = false;
        this.frameId = null;
        
        // Helper objects
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        
        // Bind methods
        this.animate = this.animate.bind(this);
        this.handleResize = this.handleResize.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleClick = this.handleClick.bind(this);
    }
    
    /**
     * Initialize the Three.js scene
     */
    initialize() {
        if (this.isInitialized) return;
        
        // Get canvas element
        const canvas = document.getElementById('game-canvas');
        if (!canvas) {
            console.error('Canvas element not found!');
            return;
        }
        
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87ceeb); // Sky blue
        
        // Create camera
        const aspect = canvas.clientWidth / canvas.clientHeight;
        this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
        this.camera.position.set(20, 20, 20);
        this.camera.lookAt(0, 0, 0);
        
        // Create renderer
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: canvas,
            antialias: true 
        });
        this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        
        // Add orbit controls
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.1;
        this.controls.screenSpacePanning = false;
        this.controls.minDistance = 5;
        this.controls.maxDistance = 50;
        this.controls.maxPolarAngle = Math.PI / 2.1; // Limit vertical rotation
        
        // Add lights
        this.addLights();
        
        // Create ground
        this.createGround();
        
        // Create container for entities
        this.entitiesContainer = new THREE.Group();
        this.scene.add(this.entitiesContainer);
        
        // Add grid helper
        const gridHelper = new THREE.GridHelper(100, 100);
        this.scene.add(gridHelper);
        
        // Add axes helper
        const axesHelper = new THREE.AxesHelper(5);
        this.scene.add(axesHelper);
        
        // Add event listeners
        window.addEventListener('resize', this.handleResize);
        canvas.addEventListener('mousemove', this.handleMouseMove);
        canvas.addEventListener('click', this.handleClick);
        
        // Start animation loop
        this.isInitialized = true;
        this.animate();
        
        console.log('Three.js scene initialized');
    }
    
    /**
     * Add lights to the scene
     */
    addLights() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
        this.scene.add(ambientLight);
        this.lights.push(ambientLight);
        
        // Directional light (sun)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 20, 10);
        directionalLight.castShadow = true;
        
        // Configure shadow properties
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 50;
        directionalLight.shadow.camera.left = -25;
        directionalLight.shadow.camera.right = 25;
        directionalLight.shadow.camera.top = 25;
        directionalLight.shadow.camera.bottom = -25;
        
        this.scene.add(directionalLight);
        this.lights.push(directionalLight);
    }
    
    /**
     * Create the ground plane
     */
    createGround() {
        const groundGeometry = new THREE.PlaneGeometry(100, 100);
        const groundMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x558833,
            roughness: 0.8,
            metalness: 0.2
        });
        
        this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
        this.ground.rotation.x = -Math.PI / 2; // Rotate to be horizontal
        this.ground.receiveShadow = true;
        this.ground.userData.isGround = true; // Mark as ground for raycasting
        
        this.scene.add(this.ground);
    }
    
    /**
     * Animation loop
     */
    animate() {
        this.frameId = requestAnimationFrame(this.animate);
        
        // Update controls
        this.controls.update();
        
        // Render the scene
        this.renderer.render(this.scene, this.camera);
    }
    
    /**
     * Handle window resize
     */
    handleResize() {
        const canvas = this.renderer.domElement;
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        
        if (this.camera) {
            this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();
        }
        
        if (this.renderer) {
            this.renderer.setSize(width, height, false);
        }
    }
    
    /**
     * Handle mouse movement
     * @param {MouseEvent} event - Mouse event
     */
    handleMouseMove(event) {
        // Calculate mouse position in normalized device coordinates
        const canvas = this.renderer.domElement;
        const rect = canvas.getBoundingClientRect();
        
        this.mouse.x = ((event.clientX - rect.left) / canvas.clientWidth) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / canvas.clientHeight) * 2 + 1;
        
        // Raycast to find intersections
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.scene.children, true);
        
        // Update mouse position display
        if (intersects.length > 0) {
            const intersection = intersects.find(intersect => 
                intersect.object.userData.isGround || 
                intersect.object.parent === this.entitiesContainer
            );
            
            if (intersection) {
                const point = intersection.point;
                const mousePositionEl = document.getElementById('mouse-position');
                if (mousePositionEl) {
                    mousePositionEl.textContent = `X: ${Math.round(point.x)}, Y: ${Math.round(point.y)}, Z: ${Math.round(point.z)}`;
                }
            }
        }
    }
    
    /**
     * Handle mouse click
     * @param {MouseEvent} event - Mouse event
     */
    handleClick(event) {
        // Raycast to find intersections
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.scene.children, true);
        
        if (intersects.length > 0) {
            // Check if we clicked on the ground
            const groundIntersection = intersects.find(intersect => intersect.object.userData.isGround);
            if (groundIntersection) {
                const point = groundIntersection.point;
                console.log(`Clicked on ground at position:`, point);
                
                // Emit ground click event
                const event = new CustomEvent('ground-click', { detail: { position: point } });
                window.dispatchEvent(event);
                return;
            }
            
            // Check if we clicked on an entity
            const entityIntersection = intersects.find(intersect => 
                intersect.object.userData.entityId ||
                (intersect.object.parent && intersect.object.parent.userData.entityId)
            );
            
            if (entityIntersection) {
                const entity = entityIntersection.object.userData.entityId 
                    ? entityIntersection.object 
                    : entityIntersection.object.parent;
                
                console.log(`Clicked on entity:`, entity.userData);
                
                // Emit entity click event
                const event = new CustomEvent('entity-click', { detail: { entity: entity.userData } });
                window.dispatchEvent(event);
                return;
            }
        }
    }
    
    /**
     * Dispose of all resources
     */
    dispose() {
        if (this.frameId) {
            cancelAnimationFrame(this.frameId);
            this.frameId = null;
        }
        
        // Remove event listeners
        window.removeEventListener('resize', this.handleResize);
        
        if (this.renderer && this.renderer.domElement) {
            this.renderer.domElement.removeEventListener('mousemove', this.handleMouseMove);
            this.renderer.domElement.removeEventListener('click', this.handleClick);
        }
        
        // Dispose of Three.js objects
        this.disposeThreeJsObjects(this.scene);
        
        // Clear references
        this.scene = null;
        this.camera = null;
        this.controls = null;
        this.lights = [];
        this.ground = null;
        this.entitiesContainer = null;
        this.isInitialized = false;
        
        console.log('Three.js scene disposed');
    }
    
    /**
     * Recursively dispose of Three.js objects
     * @param {THREE.Object3D} obj - Object to dispose
     */
    disposeThreeJsObjects(obj) {
        if (!obj) return;
        
        if (obj.children) {
            for (let i = obj.children.length - 1; i >= 0; i--) {
                this.disposeThreeJsObjects(obj.children[i]);
                obj.remove(obj.children[i]);
            }
        }
        
        if (obj.geometry) {
            obj.geometry.dispose();
        }
        
        if (obj.material) {
            if (Array.isArray(obj.material)) {
                obj.material.forEach(material => material.dispose());
            } else {
                obj.material.dispose();
            }
        }
    }
}

// Export a singleton instance
const sceneManager = new SceneManager(); 