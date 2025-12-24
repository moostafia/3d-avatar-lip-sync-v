/**
 * Audio Analysis Module
 * Handles Web Audio API integration for audio capture and analysis
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
    
    /**
     * Start audio capture from microphone
     */
    async startCapture() {
        try {
            // Request microphone access
            this.stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false
                }
            });
            
            // Create audio context
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create analyser node
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 256;
            this.analyser.smoothingTimeConstant = 0.8;
            
            // Connect microphone to analyser
            const source = this.audioContext.createMediaStreamSource(this.stream);
            source.connect(this.analyser);
            
            // Initialize data array
            const bufferLength = this.analyser.frequencyBinCount;
            this.dataArray = new Uint8Array(bufferLength);
            
            this.isCapturing = true;
            
            // Start audio level update loop
            this.updateAudioLevel();
            
            // Start visualizer if canvas is set
            if (this.visualizerCanvas) {
                this.startVisualizer();
            }
            
            // Notify status change
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
    
    /**
     * Stop audio capture
     */
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
        
        // Clear visualizer
        if (this.visualizerCtx && this.visualizerCanvas) {
            this.visualizerCtx.clearRect(0, 0, this.visualizerCanvas.width, this.visualizerCanvas.height);
            this.bars = Array(32).fill(0);
        }
        
        // Notify status change
        if (this.onStatusChange) {
            this.onStatusChange(false);
        }
        
        // Update audio level to 0
        if (this.onAudioLevelChange) {
            this.onAudioLevelChange(0);
        }
    }
    
    /**
     * Update audio level from analyser
     */
    updateAudioLevel() {
        if (!this.analyser || !this.dataArray) return;
        
        // Get frequency data
        this.analyser.getByteFrequencyData(this.dataArray);
        
        // Focus on lower frequencies for speech/mouth movement
        const lowFreqEnd = Math.floor(this.dataArray.length * 0.2);
        let sum = 0;
        for (let i = 0; i < lowFreqEnd; i++) {
            sum += this.dataArray[i];
        }
        const average = sum / lowFreqEnd / 255;
        
        this.audioLevel = average;
        
        // Notify audio level change
        if (this.onAudioLevelChange) {
            this.onAudioLevelChange(average);
        }
        
        // Continue loop
        this.animationFrame = requestAnimationFrame(() => this.updateAudioLevel());
    }
    
    /**
     * Setup audio visualizer canvas
     */
    setupVisualizer(canvas) {
        this.visualizerCanvas = canvas;
        this.visualizerCtx = canvas.getContext('2d');
        
        // Set canvas size
        const dpr = window.devicePixelRatio || 1;
        canvas.width = canvas.offsetWidth * dpr;
        canvas.height = canvas.offsetHeight * dpr;
        this.visualizerCtx.scale(dpr, dpr);
        
        // If already capturing, start visualizer
        if (this.isCapturing) {
            this.startVisualizer();
        }
    }
    
    /**
     * Start visualizer animation
     */
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
            
            // Clear canvas
            ctx.clearRect(0, 0, width, height);
            
            if (this.isCapturing) {
                // Calculate target height based on audio level
                const targetHeight = this.audioLevel * height * 0.8;
                
                // Update bars with smooth interpolation and variation
                this.bars = this.bars.map((current, index) => {
                    const variation = Math.sin(Date.now() * 0.001 + index * 0.5) * 0.1 + 0.9;
                    const target = targetHeight * variation;
                    return current + (target - current) * 0.2;
                });
            } else {
                // Decay bars when not capturing
                this.bars = this.bars.map(current => current * 0.9);
            }
            
            // Draw bars
            this.bars.forEach((barHeight, index) => {
                const x = index * barWidth;
                const y = height - barHeight;
                const h = barHeight;
                
                // Create gradient for bars
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
    
    /**
     * Get current audio level
     */
    getAudioLevel() {
        return this.audioLevel;
    }
    
    /**
     * Check if currently capturing
     */
    getIsCapturing() {
        return this.isCapturing;
    }
}

// Export as global
window.AudioAnalyzer = AudioAnalyzer;
