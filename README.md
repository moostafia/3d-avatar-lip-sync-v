# 3D Avatar Lip Sync

A complete HTML5 application featuring a 3D animated avatar that responds to audio with lip-syncing capabilities. The avatar can float anywhere on the webpage, is draggable, scalable, and movable - similar to a desktop mascot that works on both mobile devices and computers.

![3D Avatar Lip Sync Demo](https://github.com/user-attachments/assets/6c5cb6b6-9f63-4c0e-9114-278bf8c7c7b8)

## 🌟 Features

### Core Functionality

- **3D Avatar Rendering**: Real-time 3D graphics using Three.js with smooth animations
- **Audio-Responsive Lip Syncing**: Captures and analyzes audio to drive realistic mouth movements
- **Floating Window**: Draggable in-page floating window that stays on top
- **Pop-Out Window**: Open avatar in a separate browser window
- **Real-Time Audio Visualizer**: Animated frequency bars showing audio input
- **8 Preset Models**: Curated collection of 3D models ready to use
- **Custom Model Support**: Load your own GLTF/GLB models via URL
- **Advanced Settings**: Fine-tune lip-sync with sensitivity, smoothing, and range controls
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Dark Sci-Fi Theme**: Beautiful, modern UI with cyan accents

## 🚀 Quick Start

### Option 1: Standalone Version (Recommended for Production)

The `public/` folder contains a complete standalone HTML5 application that works in any modern browser:

```bash
# Serve the public folder with any HTTP server
cd public

# Using Python
python -m http.server 8000

# Using Node.js (http-server)
npx http-server -p 8000

# Using PHP
php -S localhost:8000
```

Then open `http://localhost:8000` in your browser.

**Note**: For full functionality with 3D models, you'll need internet access to load Three.js from CDN and GLTF models from GitHub.

### Option 2: React Development Version

For development with hot reload and the full React toolchain:

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 📖 Usage Guide

### Getting Started

1. **Select a Model**
   - Choose from 8 preset 3D models in the dropdown
   - Or enter a custom GLTF/GLB model URL and click "Load"

2. **Enable Audio Capture**
   - Click "Start Capture" button
   - Grant microphone permissions when prompted
   - The avatar will now lip-sync to your audio

3. **Adjust Settings**
   - Click "Advanced Controls" to expand settings
   - Adjust sensitivity, smoothing, and mouth range
   - Changes apply in real-time

4. **Use Floating Windows**
   - Click "Float" for an in-page draggable window
   - Click "Pop Out" to open in a separate browser window
   - Drag windows anywhere on your screen

### Settings Explained

- **Sensitivity (0.5x - 5x)**: Controls how much audio affects mouth movement. Higher = more responsive
- **Smoothing (0% - 95%)**: Reduces jitter for smoother animations. Higher = smoother but less responsive
- **Minimum Open (0% - 50%)**: Base mouth opening when idle
- **Maximum Open (50% - 100%)**: Maximum mouth opening at peak volume

## 🛠️ Technical Details

### File Structure

```
├── public/                 # Standalone HTML5 application
│   ├── index.html         # Main HTML structure and UI
│   ├── style.css          # Complete styling and animations
│   ├── app.js             # Combined application (ES modules)
│   ├── audio.js           # Web Audio API (standalone)
│   ├── avatar.js          # Three.js rendering (standalone)
│   ├── controls.js        # UI controls (standalone)
│   ├── popout.html        # Pop-out window page
│   └── README.md          # Standalone version documentation
├── src/                   # React application source
│   ├── App.tsx            # Main React component
│   ├── components/        # React components
│   ├── hooks/             # Custom React hooks
│   └── lib/               # Utilities and models
├── package.json           # Node.js dependencies
└── README.md              # This file
```

### Browser Compatibility

- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Opera 76+
- ⚠️ Mobile browsers (limited popup window support)

### Performance

- Targets 60 FPS on desktop
- Automatic quality scaling on low-end devices
- Optimized for both desktop and mobile
- Uses requestAnimationFrame for smooth animations

### Security & Privacy

- Audio is processed locally - never sent to servers
- No data collection or tracking
- Microphone access only when explicitly granted
- Settings stored locally in browser

## 🎨 Customization

### Adding Your Own Models

1. Host your GLTF/GLB model file online (GitHub, CDN, etc.)
2. Paste the URL in the "Custom Model URL" field
3. Click "Load"

**Model Requirements:**
- Format: GLTF (.gltf) or GLB (.glb)
- Recommended: Models with morph targets for jaw/mouth
- Size: Keep under 10MB for best performance

### Styling

The application uses CSS custom properties for easy theming. Edit `public/style.css`:

```css
:root {
    --accent: oklch(0.75 0.15 195);  /* Change accent color */
    --background: oklch(0.12 0.01 250);  /* Change background */
    --foreground: oklch(0.95 0 0);  /* Change text color */
}
```

## 🐛 Troubleshooting

### Audio Not Working

- **Issue**: "Permission denied" or audio not captured
- **Solution**: Check browser permissions, ensure HTTPS (required for getUserMedia)

### Model Not Loading

- **Issue**: Model fails to load
- **Solution**: 
  - Verify URL is accessible and CORS-enabled
  - Check file format (.gltf or .glb)
  - Try with a preset model first

### Performance Issues

- **Issue**: Low FPS or choppy animation
- **Solution**:
  - Try a simpler model
  - Close other browser tabs
  - Reduce sensitivity setting
  - Check browser console for errors

### Popup Blocked

- **Issue**: Pop-out window doesn't open
- **Solution**: Allow popups in browser settings for this site

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Three.js](https://threejs.org/) - 3D graphics library
- [Khronos Group](https://github.com/KhronosGroup/glTF-Sample-Models) - Sample GLTF models
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) - Audio processing
- [GitHub Spark](https://githubnext.com/projects/github-spark) - Development platform

## 📞 Support

- 🐛 [Report a Bug](https://github.com/moostafia/3d-avatar-lip-sync-v/issues)
- 💡 [Request a Feature](https://github.com/moostafia/3d-avatar-lip-sync-v/issues)
- 📧 Contact: [GitHub Profile](https://github.com/moostafia)

---

Made with ❤️ for the 3D avatar community
