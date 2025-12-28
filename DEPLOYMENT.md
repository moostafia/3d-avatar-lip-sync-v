# Deployment Guide

## 🚀 Quick Start

### Local Development
```bash
npm install
npm run dev
```
Visit http://localhost:5000

### Production Build
```bash
npm run build
npm run preview
```
Visit http://localhost:4173

## 📦 Deploy to GitHub Pages

1. Enable GitHub Pages in repository settings
2. Set source to "GitHub Actions"
3. Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: ['main']
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist
  
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/deploy-pages@v4
        id: deployment
```

## 🌐 Other Deployment Options

### Vercel
```bash
npm i -g vercel
vercel
```

### Netlify
```bash
npm run build
# Upload dist folder to Netlify
```

### Static Hosting
Upload the `dist` folder to any static hosting service.

## ✅ What's Working

- ✅ 3D Model Display (4 built-in models)
- ✅ Audio Capture & Processing
- ✅ Real-time Animation
- ✅ Settings Persistence (localStorage)
- ✅ Floating/Pop-out Windows
- ✅ Responsive Design
- ✅ Production Build

## 🔗 Test the Application

The application is ready to deploy and test. All features are working correctly!
