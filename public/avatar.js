/**
 * Avatar Viewer Module
 * Handles Three.js 3D rendering and lip-sync animation
 */

class AvatarViewer {
    constructor(container) {
        this.container = container;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.model = null;
        this.mixer = null;
        this.morphTargets = [];
        this.currentMouthOpen = 0;
        this.animationFrame = null;
        
        // Settings
        this.settings = {
            sensitivity: 2.5,
            smoothing: 0.7,
            minOpen: 0,
            maxOpen: 1
        };
        
        // Audio data
        this.audioData = 0;
        
        // Callbacks
        this.onModelLoad = null;
        
        // Model presets
        this.modelPresets = {
            robot: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/CesiumMan/glTF/CesiumMan.gltf',
            drone: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Duck/glTF/Duck.gltf',
            helmet: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/DamagedHelmet/glTF/DamagedHelmet.gltf',
            fox: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Fox/glTF/Fox.gltf',
            brain: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/BrainStem/glTF/BrainStem.gltf',
            lantern: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Lantern/glTF/Lantern.gltf',
            buggy: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/CesiumMilkTruck/glTF/CesiumMilkTruck.gltf',
            monster: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Monster/glTF/Monster.gltf'
        };
        
        this.initScene();
    }
    
    /**
     * Initialize Three.js scene
     */
    initScene() {
        if (!this.container) return;
        
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0a0f);
        
        // Create camera
        this.camera = new THREE.PerspectiveCamera(
            45,
            this.container.clientWidth / this.container.clientHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 1.6, 3);
        this.camera.lookAt(0, 1.6, 0);
        
        // Create renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        this.container.appendChild(this.renderer.domElement);
        
        // Add lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);
        
        const keyLight = new THREE.DirectionalLight(0xffffff, 1);
        keyLight.position.set(5, 5, 5);
        keyLight.castShadow = true;
        this.scene.add(keyLight);
        
        const fillLight = new THREE.DirectionalLight(0x4dd4ff, 0.3);
        fillLight.position.set(-5, 0, -5);
        this.scene.add(fillLight);
        
        const rimLight = new THREE.DirectionalLight(0x4dd4ff, 0.5);
        rimLight.position.set(0, 5, -5);
        this.scene.add(rimLight);
        
        // Handle window resize
        window.addEventListener('resize', () => this.handleResize());
        
        // Start animation loop
        this.animate();
    }
    
    /**
     * Load 3D model
     */
    loadModel(modelIdOrUrl) {
        // Clear existing model
        if (this.model) {
            this.scene.remove(this.model);
            this.model = null;
            this.morphTargets = [];
        }
        
        // Get model URL
        let modelUrl = modelIdOrUrl;
        if (this.modelPresets[modelIdOrUrl]) {
            modelUrl = this.modelPresets[modelIdOrUrl];
        }
        
        // Load model
        const loader = new THREE.GLTFLoader();
        loader.load(
            modelUrl,
            (gltf) => this.handleModelLoad(gltf),
            (progress) => this.handleModelProgress(progress),
            (error) => this.handleModelError(error)
        );
    }
    
    /**
     * Handle model load success
     */
    handleModelLoad(gltf) {
        const model = gltf.scene;
        this.model = model;
        this.scene.add(model);
        
        // Center and scale model
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        
        model.position.x = -center.x;
        model.position.y = -center.y;
        model.position.z = -center.z;
        
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 2 / maxDim;
        model.scale.setScalar(scale);
        
        // Find meshes with morph targets
        model.traverse((child) => {
            if (child.isMesh) {
                const mesh = child;
                if (mesh.morphTargetInfluences && mesh.morphTargetDictionary) {
                    this.morphTargets.push(mesh);
                }
            }
        });
        
        // Setup animations
        if (gltf.animations && gltf.animations.length > 0) {
            this.mixer = new THREE.AnimationMixer(model);
            
            // Find idle animation
            const idleAnimation = gltf.animations.find(
                (clip) => clip.name.toLowerCase().includes('idle') || 
                         clip.name.toLowerCase().includes('breath')
            );
            
            if (idleAnimation) {
                const action = this.mixer.clipAction(idleAnimation);
                action.play();
            }
        }
        
        // Notify load success
        if (this.onModelLoad) {
            this.onModelLoad(true);
        }
    }
    
    /**
     * Handle model load progress
     */
    handleModelProgress(progress) {
        if (progress.lengthComputable) {
            const percentComplete = (progress.loaded / progress.total) * 100;
            console.log('Model loading:', percentComplete.toFixed(2) + '%');
        }
    }
    
    /**
     * Handle model load error
     */
    handleModelError(error) {
        console.error('Error loading model:', error);
        if (this.onModelLoad) {
            this.onModelLoad(false);
        }
    }
    
    /**
     * Animation loop
     */
    animate() {
        this.animationFrame = requestAnimationFrame(() => this.animate());
        
        // Update animation mixer
        if (this.mixer) {
            this.mixer.update(0.016);
        }
        
        // Rotate model
        if (this.model) {
            this.model.rotation.y += 0.002;
        }
        
        // Update lip-sync
        this.updateLipSync();
        
        // Render scene
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }
    
    /**
     * Update lip-sync based on audio data
     */
    updateLipSync() {
        // Calculate target mouth open value
        const targetMouthOpen = Math.min(1, this.audioData * this.settings.sensitivity);
        
        // Smooth transition
        this.currentMouthOpen += 
            (targetMouthOpen - this.currentMouthOpen) * (1 - this.settings.smoothing);
        
        // Map to min/max range
        const mappedValue = 
            this.settings.minOpen + 
            this.currentMouthOpen * (this.settings.maxOpen - this.settings.minOpen);
        
        // Apply to morph targets
        this.morphTargets.forEach((mesh) => {
            if (!mesh.morphTargetInfluences || !mesh.morphTargetDictionary) return;
            
            // Find jaw/mouth related morph targets
            const jawIndex = Object.keys(mesh.morphTargetDictionary).findIndex(
                (key) =>
                    key.toLowerCase().includes('jaw') ||
                    key.toLowerCase().includes('mouth') ||
                    key.toLowerCase().includes('viseme_aa') ||
                    key.toLowerCase().includes('a')
            );
            
            if (jawIndex !== -1 && mesh.morphTargetInfluences[jawIndex] !== undefined) {
                mesh.morphTargetInfluences[jawIndex] = mappedValue;
            }
        });
    }
    
    /**
     * Update audio data
     */
    setAudioData(audioLevel) {
        this.audioData = audioLevel;
    }
    
    /**
     * Update settings
     */
    updateSettings(settings) {
        this.settings = { ...this.settings, ...settings };
    }
    
    /**
     * Handle window resize
     */
    handleResize() {
        if (!this.container || !this.camera || !this.renderer) return;
        
        this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    }
    
    /**
     * Dispose resources
     */
    dispose() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        
        if (this.renderer && this.container) {
            this.container.removeChild(this.renderer.domElement);
        }
        
        if (this.renderer) {
            this.renderer.dispose();
        }
        
        window.removeEventListener('resize', () => this.handleResize());
    }
}

// Export as global
window.AvatarViewer = AvatarViewer;
