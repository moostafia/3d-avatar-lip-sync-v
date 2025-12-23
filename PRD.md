# Planning Guide

A web application that renders a draggable 3D avatar model that lip-syncs in real-time to system audio output, functioning as a floating desktop widget controllable through a browser-based control panel.

**Experience Qualities**: 
1. **Futuristic** - Cutting-edge 3D graphics and audio visualization that feels like science fiction technology
2. **Playful** - Delightful interactions with draggable avatars that bring personality to audio playback
3. **Precise** - Accurate lip-sync mapping and responsive controls for fine-tuning performance

**Complexity Level**: Complex Application (advanced functionality, likely with multiple views)
This application requires sophisticated 3D rendering with Three.js, real-time audio analysis with Web Audio API, coordinate mapping between browser and desktop space, GLTF model loading with skeletal animation, and a comprehensive settings system for calibration.

## Essential Features

### 3D Avatar Rendering
- **Functionality**: Load and display GLTF/GLB 3D models with rigged facial bones in a Three.js scene
- **Purpose**: Provides the visual character that users will animate with their audio
- **Trigger**: App initialization and model selection from dropdown
- **Progression**: User opens app → selects model from preset list or enters custom URL → model loads in floating window → displays in T-pose/idle state
- **Success criteria**: Model renders smoothly at 60fps, bones are properly identified, lighting shows model details clearly

### Real-Time Audio Capture & Analysis
- **Functionality**: Capture system audio output using Web Audio API, analyze frequency and amplitude data to drive mouth movements
- **Purpose**: Creates the lip-sync effect by translating audio characteristics into facial animation
- **Trigger**: User clicks "Start Audio Capture" button and grants microphone/audio permissions
- **Progression**: User clicks start → browser requests audio permission → system grants access → audio analyzer begins processing → frequency data extracted → jaw/mouth blend shapes updated per frame
- **Success criteria**: Mouth movements correlate accurately with audio volume and frequency, latency under 50ms, no audio dropouts

### Draggable Floating Widget
- **Functionality**: Allow the 3D model view to be dragged outside the browser window bounds and positioned anywhere on screen
- **Purpose**: Enables the avatar to function as a persistent desktop companion during video calls, streaming, or chatbot interactions
- **Trigger**: User clicks and drags the model preview area
- **Progression**: User hovers over model → cursor changes to move icon → clicks and drags → window follows cursor in real-time → releases to drop in new position → window stays in position even when browser minimized
- **Success criteria**: Smooth dragging with no lag, window persists outside browser bounds, respects screen edges, maintains render loop when detached

### Lip-Sync Calibration Controls
- **Functionality**: Adjustable sliders and inputs for sensitivity, mouth open range, smoothing, and bone weight mapping
- **Purpose**: Allows users to fine-tune lip-sync to work optimally with different voices, audio levels, and model types
- **Trigger**: User opens settings panel and adjusts any control
- **Progression**: User opens settings → adjusts sensitivity slider → sees real-time preview of mouth movement changes → tweaks smoothing for less jitter → maps specific bones if model has custom rig → saves preset
- **Success criteria**: Changes apply in real-time with no delay, settings persist between sessions, preset system works reliably

### Model Library & Custom URLs
- **Functionality**: Dropdown selector with 3-5 pre-configured avatar models (ReadyPlayerMe, VRoid, etc.) plus custom URL input for GLTF/GLB files
- **Purpose**: Gives users variety and flexibility to use their own character models
- **Trigger**: User clicks model selector dropdown or pastes custom URL
- **Progression**: User clicks dropdown → sees thumbnail previews of models → selects one → model loads with progress indicator → automatic bone detection runs → model appears animated
- **Success criteria**: All preset models load within 3 seconds, custom URLs validate before loading, error handling for malformed files

### Control Panel Interface
- **Functionality**: Main browser window serves as mission control with model selector, audio controls, settings panel, and status indicators
- **Purpose**: Provides centralized control while the avatar floats independently
- **Trigger**: App launch displays control panel by default
- **Progression**: User launches app → sees control panel with all options → makes selections → spawns floating avatar → minimizes browser → avatar continues working
- **Success criteria**: Clean layout, all controls accessible without scrolling on desktop, responsive on tablet/mobile

## Edge Case Handling

- **No Audio Input**: Display clear message prompting user to enable microphone/audio capture with troubleshooting tips
- **Browser Permission Denied**: Show fallback mode with idle animations instead of lip-sync, guide user to permission settings
- **Model Load Failure**: Show error toast with details, revert to default working model automatically
- **Unsupported Bone Structure**: Attempt automatic bone mapping, if fails show warning and disable lip-sync for that model
- **Window Dragged Off-Screen**: Auto-snap back to nearest visible screen edge after 2 seconds
- **Audio Overload/Clipping**: Implement automatic gain control to prevent excessive mouth movements
- **Mobile Limitations**: On mobile, avatar stays within browser viewport since multi-window not supported, show notice
- **Low Frame Rate**: Reduce render quality automatically, show performance warning if FPS drops below 30

## Design Direction

The design should evoke a futuristic control center aesthetic—think spaceship cockpit meets streaming overlay. It should feel technical yet approachable, with glowing accents and smooth animations that make users feel like they're operating advanced technology. The 3D avatar should feel alive and responsive, not robotic or janky.

## Color Selection

A dark, high-contrast sci-fi theme with electric accents that won't distract from the 3D model.

- **Primary Color**: Deep Space Blue (oklch(0.25 0.05 250)) - Communicates technology and depth, creates premium feel without harshness
- **Secondary Colors**: 
  - Dark Panel Gray (oklch(0.15 0.01 250)) - For control panel backgrounds, creates depth hierarchy
  - Mid Gray (oklch(0.35 0.02 250)) - For inactive controls and borders
- **Accent Color**: Electric Cyan (oklch(0.75 0.15 195)) - Draws attention to active controls and status indicators, feels energetic and modern
- **Foreground/Background Pairings**: 
  - Background Dark (oklch(0.12 0.01 250)): White text (oklch(0.95 0 0)) - Ratio 14.2:1 ✓
  - Primary Blue (oklch(0.25 0.05 250)): White text (oklch(0.95 0 0)) - Ratio 8.1:1 ✓
  - Accent Cyan (oklch(0.75 0.15 195)): Dark text (oklch(0.12 0.01 250)) - Ratio 11.3:1 ✓
  - Secondary Gray (oklch(0.35 0.02 250)): White text (oklch(0.95 0 0)) - Ratio 6.2:1 ✓

## Font Selection

Typography should balance technical precision with modern readability—monospace for data/settings, clean sans-serif for UI.

- **Typographic Hierarchy**: 
  - H1 (Page Title): Space Grotesk Bold / 32px / tight tracking (-0.02em) / cyan accent color
  - H2 (Section Headers): Space Grotesk Semibold / 20px / normal tracking / white
  - Body (Labels, Descriptions): Inter Regular / 14px / relaxed line-height (1.6) / light gray
  - Monospace (Values, URLs): JetBrains Mono / 13px / normal tracking / cyan for active values
  - Small (Helper Text): Inter Regular / 12px / muted gray

## Animations

Animations should reinforce the feeling of responsiveness and technological sophistication—fluid, purposeful, with occasional moments of delight.

Subtle state transitions for all controls (200ms ease-out), glowing pulse on active audio capture (2s loop), smooth model rotation on load (3s ease-in-out), gentle idle breathing animation when no audio detected, satisfying button press feedback with slight scale down, settings panel slide-in from right (300ms cubic-bezier), and sparkle effect when model successfully loads.

## Component Selection

- **Components**: 
  - Card (control panel background, settings sections) - add subtle border glow on hover
  - Button (primary actions like "Start Audio", "Load Model") - use cyan accent with hover glow effect
  - Slider (sensitivity, smoothing, range controls) - custom thumb with cyan gradient
  - Select (model dropdown) - dark theme with previews
  - Input (custom URL field) - monospace font, cyan border focus
  - Switch (toggle features on/off) - cyan when active
  - Separator (divide sections visually)
  - Label (all form controls)
  - Badge (status indicators like "Recording", "Idle") - pulsing animation when active
  - Accordion (collapsible advanced settings)
  - Toast (error/success notifications via Sonner)
  
- **Customizations**: 
  - 3D canvas component (Three.js scene wrapper with full control over rendering)
  - Audio visualizer bars component (small frequency visualization next to audio controls)
  - Model preview thumbnails (small 3D renders for model selection)
  - Floating window controller (custom draggable overlay container)
  
- **States**: 
  - Buttons: Default (cyan gradient), Hover (brighter glow), Active (scale 0.95), Disabled (gray, 50% opacity)
  - Sliders: Track (dark gray), Filled (cyan gradient), Thumb (white with cyan glow on drag)
  - Inputs: Default (subtle border), Focus (cyan border glow), Error (red border), Success (green border)
  - Model viewer: Loading (skeleton with shimmer), Loaded (smooth fade-in), Error (red tint overlay)
  
- **Icon Selection**: 
  - Microphone (audio capture control)
  - Play/Pause (control audio processing)
  - GearSix (settings panel)
  - ArrowsOut (fullscreen/detach window)
  - Download (save settings preset)
  - Upload (load custom model)
  - SlidersHorizontal (calibration controls)
  - Eye (toggle visibility)
  - WarningCircle (error states)
  
- **Spacing**: 
  - Control panel padding: p-6 (24px)
  - Section gaps: gap-6 (24px)
  - Control groups: gap-4 (16px)
  - Inline controls: gap-2 (8px)
  - Card borders: rounded-lg (8px)
  
- **Mobile**: 
  - Stack control sections vertically (single column layout)
  - Full-width buttons and controls on mobile
  - Avatar fills top 50% of screen, controls in bottom 50% (no floating window on mobile)
  - Collapsible accordion for advanced settings to save space
  - Larger touch targets (min 44px height for all interactive elements)
  - Simplified model previews (text-only dropdown on small screens)
