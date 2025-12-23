/**
 * Main Application Entry Point
 * Combines audio, avatar, and controls into one module
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Make THREE globally available for compatibility
window.THREE = THREE;

/**
 * Audio Analyzer Class
 */
class AudioAnalyzer {
    constructor() {
        this.audioContext = null;
        this.analyser = null;
        this.dataArray = null;
        this.stream = null;
        this.isCapturing = false;
        this.audioLevel = 0;
        this.animationFrame = null;
        
        // Audio visualizer
        this.visualizerCanvas = null;
        this.visualizerCtx = null;
        this.bars = Array(32).fill(0);
        this.visualizerAnimationFrame = null;
        
        // Callbacks
        this.onAudioLevelChange = null;
        this.onError = null;
        this.onStatusChange = null;
    }
    
    async startCapture() {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false
                }
            });
            
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 256;
            this.analyser.smoothingTimeConstant = 0.8;
            
            const source = this.audioContext.createMediaStreamSource(this.stream);
            source.connect(this.analyser);
            
            const bufferLength = this.analyser.frequencyBinCount;
            this.dataArray = new Uint8Array(bufferLength);
            
            this.isCapturing = true;
            this.updateAudioLevel();
            
            if (this.visualizerCanvas) {
                this.startVisualizer();
            }
            
            if (this.onStatusChange) {
                this.onStatusChange(true);
            }
            
            return { success: true };
        } catch (error) {
            const errorMessage = error.message || 'Failed to access microphone';
            if (this.onError) {
                this.onError(errorMessage);
            }
            console.error('Audio capture error:', error);
            return { success: false, error: errorMessage };
        }
    }
    
    stopCapture() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
        
        if (this.visualizerAnimationFrame) {
            cancelAnimationFrame(this.visualizerAnimationFrame);
            this.visualizerAnimationFrame = null;
        }
        
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
        
        this.analyser = null;
        this.dataArray = null;
        this.isCapturing = false;
        this.audioLevel = 0;
        
        if (this.visualizerCtx && this.visualizerCanvas) {
            this.visualizerCtx.clearRect(0, 0, this.visualizerCanvas.width, this.visualizerCanvas.height);
            this.bars = Array(32).fill(0);
        }
        
        if (this.onStatusChange) {
            this.onStatusChange(false);
        }
        
        if (this.onAudioLevelChange) {
            this.onAudioLevelChange(0);
        }
    }
    
    updateAudioLevel() {
        if (!this.analyser || !this.dataArray) return;
        
        this.analyser.getByteFrequencyData(this.dataArray);
        
        const lowFreqEnd = Math.floor(this.dataArray.length * 0.2);
        let sum = 0;
        for (let i = 0; i < lowFreqEnd; i++) {
            sum += this.dataArray[i];
        }
        const average = sum / lowFreqEnd / 255;
        
        this.audioLevel = average;
        
        if (this.onAudioLevelChange) {
            this.onAudioLevelChange(average);
        }
        
        this.animationFrame = requestAnimationFrame(() => this.updateAudioLevel());
    }
    
    setupVisualizer(canvas) {
        this.visualizerCanvas = canvas;
        this.visualizerCtx = canvas.getContext('2d');
        
        const dpr = window.devicePixelRatio || 1;
        canvas.width = canvas.offsetWidth * dpr;
        canvas.height = canvas.offsetHeight * dpr;
        this.visualizerCtx.scale(dpr, dpr);
        
        if (this.isCapturing) {
            this.startVisualizer();
        }
    }
    
    startVisualizer() {
        if (!this.visualizerCanvas || !this.visualizerCtx) return;
        
        const animate = () => {
            const ctx = this.visualizerCtx;
            const canvas = this.visualizerCanvas;
            const width = canvas.offsetWidth;
            const height = canvas.offsetHeight;
            const barCount = this.bars.length;
            const barWidth = width / barCount;
            const padding = 1;
            
            ctx.clearRect(0, 0, width, height);
            
            if (this.isCapturing) {
                const targetHeight = this.audioLevel * height * 0.8;
                this.bars = this.bars.map((current, index) => {
                    const variation = Math.sin(Date.now() * 0.001 + index * 0.5) * 0.1 + 0.9;
                    const target = targetHeight * variation;
                    return current + (target - current) * 0.2;
                });
            } else {
                this.bars = this.bars.map(current => current * 0.9);
            }
            
            this.bars.forEach((barHeight, index) => {
                const x = index * barWidth;
                const y = height - barHeight;
                const h = barHeight;
                
                const gradient = ctx.createLinearGradient(0, y, 0, height);
                gradient.addColorStop(0, 'oklch(0.75 0.15 195)');
                gradient.addColorStop(1, 'oklch(0.55 0.12 195)');
                
                ctx.fillStyle = gradient;
                ctx.fillRect(x + padding, y, barWidth - padding * 2, h);
            });
            
            this.visualizerAnimationFrame = requestAnimationFrame(animate);
        };
        
        animate();
    }
    
    getAudioLevel() {
        return this.audioLevel;
    }
    
    getIsCapturing() {
        return this.isCapturing;
    }
}

/**
 * Avatar Viewer Class
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
        
        this.settings = {
            sensitivity: 2.5,
            smoothing: 0.7,
            minOpen: 0,
            maxOpen: 1
        };
        
        this.audioData = 0;
        this.onModelLoad = null;
        
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
    
    initScene() {
        if (!this.container) return;
        
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0a0f);
        
        this.camera = new THREE.PerspectiveCamera(
            45,
            this.container.clientWidth / this.container.clientHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 1.6, 3);
        this.camera.lookAt(0, 1.6, 0);
        
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        this.container.appendChild(this.renderer.domElement);
        
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
        
        window.addEventListener('resize', () => this.handleResize());
        
        this.animate();
    }
    
    loadModel(modelIdOrUrl) {
        if (this.model) {
            this.scene.remove(this.model);
            this.model = null;
            this.morphTargets = [];
        }
        
        let modelUrl = modelIdOrUrl;
        if (this.modelPresets[modelIdOrUrl]) {
            modelUrl = this.modelPresets[modelIdOrUrl];
        }
        
        const loader = new GLTFLoader();
        loader.load(
            modelUrl,
            (gltf) => this.handleModelLoad(gltf),
            (progress) => this.handleModelProgress(progress),
            (error) => this.handleModelError(error)
        );
    }
    
    handleModelLoad(gltf) {
        const model = gltf.scene;
        this.model = model;
        this.scene.add(model);
        
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        
        model.position.x = -center.x;
        model.position.y = -center.y;
        model.position.z = -center.z;
        
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 2 / maxDim;
        model.scale.setScalar(scale);
        
        model.traverse((child) => {
            if (child.isMesh) {
                const mesh = child;
                if (mesh.morphTargetInfluences && mesh.morphTargetDictionary) {
                    this.morphTargets.push(mesh);
                }
            }
        });
        
        if (gltf.animations && gltf.animations.length > 0) {
            this.mixer = new THREE.AnimationMixer(model);
            
            const idleAnimation = gltf.animations.find(
                (clip) => clip.name.toLowerCase().includes('idle') || 
                         clip.name.toLowerCase().includes('breath')
            );
            
            if (idleAnimation) {
                const action = this.mixer.clipAction(idleAnimation);
                action.play();
            }
        }
        
        if (this.onModelLoad) {
            this.onModelLoad(true);
        }
    }
    
    handleModelProgress(progress) {
        if (progress.lengthComputable) {
            const percentComplete = (progress.loaded / progress.total) * 100;
            console.log('Model loading:', percentComplete.toFixed(2) + '%');
        }
    }
    
    handleModelError(error) {
        console.error('Error loading model:', error);
        if (this.onModelLoad) {
            this.onModelLoad(false);
        }
    }
    
    animate() {
        this.animationFrame = requestAnimationFrame(() => this.animate());
        
        if (this.mixer) {
            this.mixer.update(0.016);
        }
        
        if (this.model) {
            this.model.rotation.y += 0.002;
        }
        
        this.updateLipSync();
        
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }
    
    updateLipSync() {
        const targetMouthOpen = Math.min(1, this.audioData * this.settings.sensitivity);
        
        this.currentMouthOpen += 
            (targetMouthOpen - this.currentMouthOpen) * (1 - this.settings.smoothing);
        
        const mappedValue = 
            this.settings.minOpen + 
            this.currentMouthOpen * (this.settings.maxOpen - this.settings.minOpen);
        
        this.morphTargets.forEach((mesh) => {
            if (!mesh.morphTargetInfluences || !mesh.morphTargetDictionary) return;
            
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
    
    setAudioData(audioLevel) {
        this.audioData = audioLevel;
    }
    
    updateSettings(settings) {
        this.settings = { ...this.settings, ...settings };
    }
    
    handleResize() {
        if (!this.container || !this.camera || !this.renderer) return;
        
        this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    }
    
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

// Global instances
let audioAnalyzer = null;
let mainAvatarViewer = null;
let floatingAvatarViewer = null;
let popoutWindow = null;

const DEFAULT_SETTINGS = {
    sensitivity: 2.5,
    smoothing: 0.7,
    minOpen: 0,
    maxOpen: 1
};

let currentSettings = { ...DEFAULT_SETTINGS };

// Initialize the application
function init() {
    audioAnalyzer = new AudioAnalyzer();
    
    audioAnalyzer.onAudioLevelChange = handleAudioLevelChange;
    audioAnalyzer.onError = handleAudioError;
    audioAnalyzer.onStatusChange = handleAudioStatusChange;
    
    const mainContainer = document.getElementById('avatar-container');
    if (mainContainer) {
        mainAvatarViewer = new AvatarViewer(mainContainer);
        mainAvatarViewer.onModelLoad = handleModelLoad;
        mainAvatarViewer.loadModel('robot');
    }
    
    const visualizerCanvas = document.getElementById('audio-visualizer');
    if (visualizerCanvas) {
        audioAnalyzer.setupVisualizer(visualizerCanvas);
    }
    
    setupEventListeners();
    loadSettings();
}

function setupEventListeners() {
    const modelSelect = document.getElementById('model-select');
    if (modelSelect) {
        modelSelect.addEventListener('change', (e) => {
            handleModelChange(e.target.value);
        });
    }
    
    const loadCustomBtn = document.getElementById('load-custom');
    const customUrlInput = document.getElementById('custom-url');
    if (loadCustomBtn && customUrlInput) {
        loadCustomBtn.addEventListener('click', () => {
            handleCustomModelLoad(customUrlInput.value);
        });
        
        customUrlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleCustomModelLoad(customUrlInput.value);
            }
        });
    }
    
    const audioToggle = document.getElementById('audio-toggle');
    if (audioToggle) {
        audioToggle.addEventListener('click', handleAudioToggle);
    }
    
    const sensitivitySlider = document.getElementById('sensitivity');
    const smoothingSlider = document.getElementById('smoothing');
    const minOpenSlider = document.getElementById('min-open');
    const maxOpenSlider = document.getElementById('max-open');
    
    if (sensitivitySlider) {
        sensitivitySlider.addEventListener('input', (e) => {
            currentSettings.sensitivity = parseFloat(e.target.value);
            updateSettingDisplay('sensitivity', currentSettings.sensitivity);
            updateAvatarSettings();
            saveSettings();
        });
    }
    
    if (smoothingSlider) {
        smoothingSlider.addEventListener('input', (e) => {
            currentSettings.smoothing = parseFloat(e.target.value);
            updateSettingDisplay('smoothing', currentSettings.smoothing);
            updateAvatarSettings();
            saveSettings();
        });
    }
    
    if (minOpenSlider) {
        minOpenSlider.addEventListener('input', (e) => {
            currentSettings.minOpen = parseFloat(e.target.value);
            updateSettingDisplay('min-open', currentSettings.minOpen);
            updateAvatarSettings();
            saveSettings();
        });
    }
    
    if (maxOpenSlider) {
        maxOpenSlider.addEventListener('input', (e) => {
            currentSettings.maxOpen = parseFloat(e.target.value);
            updateSettingDisplay('max-open', currentSettings.maxOpen);
            updateAvatarSettings();
            saveSettings();
        });
    }
    
    const resetBtn = document.getElementById('reset-settings');
    if (resetBtn) {
        resetBtn.addEventListener('click', handleResetSettings);
    }
    
    const floatBtn = document.getElementById('float-button');
    if (floatBtn) {
        floatBtn.addEventListener('click', handleOpenFloating);
    }
    
    const closeFloatBtn = document.getElementById('close-float');
    if (closeFloatBtn) {
        closeFloatBtn.addEventListener('click', handleCloseFloating);
    }
    
    const minimizeFloatBtn = document.getElementById('minimize-float');
    if (minimizeFloatBtn) {
        minimizeFloatBtn.addEventListener('click', handleMinimizeFloating);
    }
    
    const popoutBtn = document.getElementById('popout-button');
    if (popoutBtn) {
        popoutBtn.addEventListener('click', handleOpenPopout);
    }
    
    setupFloatingWindowDrag();
}

function handleModelChange(modelId) {
    showLoadingBadge(true);
    if (mainAvatarViewer) {
        mainAvatarViewer.loadModel(modelId);
    }
    if (floatingAvatarViewer) {
        floatingAvatarViewer.loadModel(modelId);
    }
}

function handleCustomModelLoad(url) {
    if (!url || !url.trim()) {
        showToast('Please enter a model URL', 'error');
        return;
    }
    
    if (!url.toLowerCase().endsWith('.gltf') && !url.toLowerCase().endsWith('.glb')) {
        showToast('Invalid model URL - Must end with .gltf or .glb', 'error');
        return;
    }
    
    showLoadingBadge(true);
    if (mainAvatarViewer) {
        mainAvatarViewer.loadModel(url);
    }
    if (floatingAvatarViewer) {
        floatingAvatarViewer.loadModel(url);
    }
}

function handleModelLoad(success) {
    showLoadingBadge(false);
    if (success) {
        showToast('Model loaded successfully', 'success');
    } else {
        showToast('Failed to load model - Please check the URL', 'error');
    }
}

async function handleAudioToggle() {
    if (audioAnalyzer.getIsCapturing()) {
        audioAnalyzer.stopCapture();
        showToast('Audio capture stopped', 'info');
    } else {
        const result = await audioAnalyzer.startCapture();
        if (result.success) {
            showToast('Audio capture started - Avatar will now lip-sync', 'success');
        }
    }
}

function handleAudioLevelChange(level) {
    const progressFill = document.getElementById('audio-level');
    if (progressFill) {
        progressFill.style.width = `${level * 100}%`;
    }
    
    if (mainAvatarViewer) {
        mainAvatarViewer.setAudioData(level);
    }
    if (floatingAvatarViewer) {
        floatingAvatarViewer.setAudioData(level);
    }
    
    if (popoutWindow && !popoutWindow.closed) {
        popoutWindow.postMessage({ type: 'audioLevel', level }, '*');
    }
}

function handleAudioError(errorMessage) {
    const errorBox = document.getElementById('audio-error');
    const errorMessageEl = document.getElementById('error-message');
    
    if (errorBox && errorMessageEl) {
        errorBox.classList.remove('hidden');
        errorMessageEl.textContent = errorMessage;
    }
    
    showToast(`Audio Error: ${errorMessage}`, 'error');
}

function handleAudioStatusChange(isCapturing) {
    const audioToggle = document.getElementById('audio-toggle');
    const statusBadge = document.getElementById('status-badge');
    const audioControls = document.getElementById('audio-controls');
    const audioIcon = document.getElementById('audio-icon');
    const errorBox = document.getElementById('audio-error');
    
    if (audioToggle) {
        audioToggle.innerHTML = isCapturing
            ? `<svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
               </svg>
               Stop Capture`
            : `<svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" y1="19" x2="12" y2="23"/>
                <line x1="8" y1="23" x2="16" y2="23"/>
               </svg>
               Start Capture`;
        
        audioToggle.className = isCapturing
            ? 'button button-destructive'
            : 'button button-primary';
    }
    
    if (statusBadge) {
        statusBadge.textContent = isCapturing ? 'Recording' : 'Idle';
        statusBadge.className = isCapturing
            ? 'badge'
            : 'badge badge-secondary';
    }
    
    if (audioControls) {
        audioControls.classList.toggle('hidden', !isCapturing);
    }
    
    if (audioIcon) {
        audioIcon.classList.toggle('animate-glow-pulse', isCapturing);
    }
    
    if (errorBox && isCapturing) {
        errorBox.classList.add('hidden');
    }
}

function updateSettingDisplay(settingName, value) {
    const displayEl = document.getElementById(`${settingName}-value`);
    if (!displayEl) return;
    
    switch (settingName) {
        case 'sensitivity':
            displayEl.textContent = `${value.toFixed(1)}x`;
            break;
        case 'smoothing':
        case 'min-open':
        case 'max-open':
            displayEl.textContent = `${(value * 100).toFixed(0)}%`;
            break;
    }
}

function updateAvatarSettings() {
    if (mainAvatarViewer) {
        mainAvatarViewer.updateSettings(currentSettings);
    }
    if (floatingAvatarViewer) {
        floatingAvatarViewer.updateSettings(currentSettings);
    }
    
    if (popoutWindow && !popoutWindow.closed) {
        popoutWindow.postMessage({ type: 'settings', settings: currentSettings }, '*');
    }
}

function handleResetSettings() {
    currentSettings = { ...DEFAULT_SETTINGS };
    
    document.getElementById('sensitivity').value = currentSettings.sensitivity;
    document.getElementById('smoothing').value = currentSettings.smoothing;
    document.getElementById('min-open').value = currentSettings.minOpen;
    document.getElementById('max-open').value = currentSettings.maxOpen;
    
    updateSettingDisplay('sensitivity', currentSettings.sensitivity);
    updateSettingDisplay('smoothing', currentSettings.smoothing);
    updateSettingDisplay('min-open', currentSettings.minOpen);
    updateSettingDisplay('max-open', currentSettings.maxOpen);
    
    updateAvatarSettings();
    saveSettings();
    
    showToast('Settings reset to defaults', 'info');
}

function saveSettings() {
    try {
        localStorage.setItem('avatarSettings', JSON.stringify(currentSettings));
    } catch (error) {
        console.error('Failed to save settings:', error);
    }
}

function loadSettings() {
    try {
        const saved = localStorage.getItem('avatarSettings');
        if (saved) {
            currentSettings = { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
            
            document.getElementById('sensitivity').value = currentSettings.sensitivity;
            document.getElementById('smoothing').value = currentSettings.smoothing;
            document.getElementById('min-open').value = currentSettings.minOpen;
            document.getElementById('max-open').value = currentSettings.maxOpen;
            
            updateSettingDisplay('sensitivity', currentSettings.sensitivity);
            updateSettingDisplay('smoothing', currentSettings.smoothing);
            updateSettingDisplay('min-open', currentSettings.minOpen);
            updateSettingDisplay('max-open', currentSettings.maxOpen);
            
            updateAvatarSettings();
        }
    } catch (error) {
        console.error('Failed to load settings:', error);
    }
}

function handleOpenFloating() {
    const floatingWindow = document.getElementById('floating-window');
    const floatingContainer = document.getElementById('floating-avatar-container');
    
    if (floatingWindow && floatingContainer) {
        floatingWindow.classList.remove('hidden');
        
        if (!floatingAvatarViewer) {
            floatingAvatarViewer = new AvatarViewer(floatingContainer);
            floatingAvatarViewer.updateSettings(currentSettings);
            
            const modelSelect = document.getElementById('model-select');
            if (modelSelect) {
                floatingAvatarViewer.loadModel(modelSelect.value);
            }
        }
        
        centerFloatingWindow();
        showToast('Floating window opened - Drag to move', 'success');
    }
}

function handleCloseFloating() {
    const floatingWindow = document.getElementById('floating-window');
    if (floatingWindow) {
        floatingWindow.classList.add('hidden');
    }
    
    if (floatingAvatarViewer) {
        floatingAvatarViewer.dispose();
        floatingAvatarViewer = null;
    }
}

function handleMinimizeFloating() {
    const floatingWindow = document.getElementById('floating-window');
    if (floatingWindow) {
        floatingWindow.classList.toggle('minimized');
    }
}

function centerFloatingWindow() {
    const floatingWindow = document.getElementById('floating-window');
    if (floatingWindow) {
        const width = 500;
        const height = 600;
        const left = (window.innerWidth - width) / 2;
        const top = (window.innerHeight - height) / 2;
        
        floatingWindow.style.left = `${Math.max(0, left)}px`;
        floatingWindow.style.top = `${Math.max(0, top)}px`;
    }
}

function setupFloatingWindowDrag() {
    const floatingWindow = document.getElementById('floating-window');
    const floatingHeader = floatingWindow?.querySelector('.floating-header');
    
    if (!floatingWindow || !floatingHeader) return;
    
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    let xOffset = 0;
    let yOffset = 0;
    
    floatingHeader.addEventListener('mousedown', dragStart);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', dragEnd);
    
    function dragStart(e) {
        initialX = e.clientX - xOffset;
        initialY = e.clientY - yOffset;
        
        if (e.target === floatingHeader || floatingHeader.contains(e.target)) {
            isDragging = true;
        }
    }
    
    function drag(e) {
        if (isDragging) {
            e.preventDefault();
            
            currentX = e.clientX - initialX;
            currentY = e.clientY - initialY;
            
            xOffset = currentX;
            yOffset = currentY;
            
            setTranslate(currentX, currentY, floatingWindow);
        }
    }
    
    function dragEnd(e) {
        initialX = currentX;
        initialY = currentY;
        
        isDragging = false;
    }
    
    function setTranslate(xPos, yPos, el) {
        el.style.left = `${xPos}px`;
        el.style.top = `${yPos}px`;
    }
}

function handleOpenPopout() {
    if (popoutWindow && !popoutWindow.closed) {
        popoutWindow.focus();
        return;
    }
    
    const width = 500;
    const height = 600;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    
    popoutWindow = window.open(
        'popout.html',
        '3D Avatar Floating Window',
        `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=no,status=no,location=no,toolbar=no,menubar=no`
    );
    
    if (!popoutWindow) {
        showToast('Popup blocked! Please allow popups for this site', 'error');
        return;
    }
    
    showToast('Browser window opened - Drag it anywhere!', 'success');
    
    const checkClosed = setInterval(() => {
        if (popoutWindow?.closed) {
            clearInterval(checkClosed);
            popoutWindow = null;
        }
    }, 500);
}

function showLoadingBadge(show) {
    const badge = document.getElementById('loading-badge');
    if (badge) {
        badge.classList.toggle('hidden', !show);
        if (show) {
            badge.classList.add('animate-shimmer');
        } else {
            badge.classList.remove('animate-shimmer');
        }
    }
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';
    
    toast.innerHTML = `
        <div class="toast-content">
            <div class="toast-title">${icon} ${message}</div>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">✕</button>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
