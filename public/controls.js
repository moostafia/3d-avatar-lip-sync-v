/**
 * Controls Module
 * Handles UI interactions and coordinates between audio and avatar modules
 */

// Global instances
let audioAnalyzer = null;
let mainAvatarViewer = null;
let floatingAvatarViewer = null;
let popoutWindow = null;

// Settings
const DEFAULT_SETTINGS = {
    sensitivity: 2.5,
    smoothing: 0.7,
    minOpen: 0,
    maxOpen: 1
};

let currentSettings = { ...DEFAULT_SETTINGS };

/**
 * Initialize the application
 */
function init() {
    // Initialize audio analyzer
    audioAnalyzer = new AudioAnalyzer();
    
    // Setup audio callbacks
    audioAnalyzer.onAudioLevelChange = handleAudioLevelChange;
    audioAnalyzer.onError = handleAudioError;
    audioAnalyzer.onStatusChange = handleAudioStatusChange;
    
    // Initialize main avatar viewer
    const mainContainer = document.getElementById('avatar-container');
    if (mainContainer) {
        mainAvatarViewer = new AvatarViewer(mainContainer);
        mainAvatarViewer.onModelLoad = handleModelLoad;
        // Load default model
        mainAvatarViewer.loadModel('robot');
    }
    
    // Setup audio visualizer
    const visualizerCanvas = document.getElementById('audio-visualizer');
    if (visualizerCanvas) {
        audioAnalyzer.setupVisualizer(visualizerCanvas);
    }
    
    // Setup event listeners
    setupEventListeners();
    
    // Load saved settings from localStorage
    loadSettings();
}

/**
 * Setup all event listeners
 */
function setupEventListeners() {
    // Model selection
    const modelSelect = document.getElementById('model-select');
    if (modelSelect) {
        modelSelect.addEventListener('change', (e) => {
            handleModelChange(e.target.value);
        });
    }
    
    // Custom model load
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
    
    // Audio toggle
    const audioToggle = document.getElementById('audio-toggle');
    if (audioToggle) {
        audioToggle.addEventListener('click', handleAudioToggle);
    }
    
    // Settings sliders
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
    
    // Reset settings
    const resetBtn = document.getElementById('reset-settings');
    if (resetBtn) {
        resetBtn.addEventListener('click', handleResetSettings);
    }
    
    // Floating window controls
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
    
    // Popout window
    const popoutBtn = document.getElementById('popout-button');
    if (popoutBtn) {
        popoutBtn.addEventListener('click', handleOpenPopout);
    }
    
    // Make floating window draggable
    setupFloatingWindowDrag();
}

/**
 * Handle model change
 */
function handleModelChange(modelId) {
    showLoadingBadge(true);
    if (mainAvatarViewer) {
        mainAvatarViewer.loadModel(modelId);
    }
    if (floatingAvatarViewer) {
        floatingAvatarViewer.loadModel(modelId);
    }
}

/**
 * Handle custom model load
 */
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

/**
 * Handle model load callback
 */
function handleModelLoad(success) {
    showLoadingBadge(false);
    if (success) {
        showToast('Model loaded successfully', 'success');
    } else {
        showToast('Failed to load model - Please check the URL', 'error');
    }
}

/**
 * Handle audio toggle
 */
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

/**
 * Handle audio level change
 */
function handleAudioLevelChange(level) {
    // Update progress bar
    const progressFill = document.getElementById('audio-level');
    if (progressFill) {
        progressFill.style.width = `${level * 100}%`;
    }
    
    // Update avatar viewers
    if (mainAvatarViewer) {
        mainAvatarViewer.setAudioData(level);
    }
    if (floatingAvatarViewer) {
        floatingAvatarViewer.setAudioData(level);
    }
    
    // Send to popout window
    if (popoutWindow && !popoutWindow.closed) {
        popoutWindow.postMessage({ type: 'audioLevel', level }, '*');
    }
}

/**
 * Handle audio error
 */
function handleAudioError(errorMessage) {
    const errorBox = document.getElementById('audio-error');
    const errorMessageEl = document.getElementById('error-message');
    
    if (errorBox && errorMessageEl) {
        errorBox.classList.remove('hidden');
        errorMessageEl.textContent = errorMessage;
    }
    
    showToast(`Audio Error: ${errorMessage}`, 'error');
}

/**
 * Handle audio status change
 */
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

/**
 * Update setting display value
 */
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

/**
 * Update avatar settings
 */
function updateAvatarSettings() {
    if (mainAvatarViewer) {
        mainAvatarViewer.updateSettings(currentSettings);
    }
    if (floatingAvatarViewer) {
        floatingAvatarViewer.updateSettings(currentSettings);
    }
    
    // Send to popout window
    if (popoutWindow && !popoutWindow.closed) {
        popoutWindow.postMessage({ type: 'settings', settings: currentSettings }, '*');
    }
}

/**
 * Handle reset settings
 */
function handleResetSettings() {
    currentSettings = { ...DEFAULT_SETTINGS };
    
    // Update UI
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

/**
 * Save settings to localStorage
 */
function saveSettings() {
    try {
        localStorage.setItem('avatarSettings', JSON.stringify(currentSettings));
    } catch (error) {
        console.error('Failed to save settings:', error);
    }
}

/**
 * Load settings from localStorage
 */
function loadSettings() {
    try {
        const saved = localStorage.getItem('avatarSettings');
        if (saved) {
            currentSettings = { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
            
            // Update UI
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

/**
 * Handle open floating window
 */
function handleOpenFloating() {
    const floatingWindow = document.getElementById('floating-window');
    const floatingContainer = document.getElementById('floating-avatar-container');
    
    if (floatingWindow && floatingContainer) {
        floatingWindow.classList.remove('hidden');
        
        // Initialize floating avatar if not already done
        if (!floatingAvatarViewer) {
            floatingAvatarViewer = new AvatarViewer(floatingContainer);
            floatingAvatarViewer.updateSettings(currentSettings);
            
            // Load current model
            const modelSelect = document.getElementById('model-select');
            if (modelSelect) {
                floatingAvatarViewer.loadModel(modelSelect.value);
            }
        }
        
        // Center the floating window
        centerFloatingWindow();
        
        showToast('Floating window opened - Drag to move', 'success');
    }
}

/**
 * Handle close floating window
 */
function handleCloseFloating() {
    const floatingWindow = document.getElementById('floating-window');
    if (floatingWindow) {
        floatingWindow.classList.add('hidden');
    }
    
    // Dispose floating avatar
    if (floatingAvatarViewer) {
        floatingAvatarViewer.dispose();
        floatingAvatarViewer = null;
    }
}

/**
 * Handle minimize floating window
 */
function handleMinimizeFloating() {
    const floatingWindow = document.getElementById('floating-window');
    if (floatingWindow) {
        floatingWindow.classList.toggle('minimized');
    }
}

/**
 * Center floating window
 */
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

/**
 * Setup floating window drag
 */
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

/**
 * Handle open popout window
 */
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
    
    // Check if window is closed
    const checkClosed = setInterval(() => {
        if (popoutWindow?.closed) {
            clearInterval(checkClosed);
            popoutWindow = null;
        }
    }, 500);
}

/**
 * Show loading badge
 */
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

/**
 * Show toast notification
 */
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
    
    // Auto remove after 4 seconds
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
