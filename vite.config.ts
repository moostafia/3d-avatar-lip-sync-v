import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig, PluginOption } from "vite";

import sparkPlugin from "@github/spark/spark-vite-plugin";
import createIconImportProxy from "@github/spark/vitePhosphorIconProxyPlugin";
import { resolve } from 'path'
import fs from 'fs'

const projectRoot = process.env.PROJECT_ROOT || import.meta.dirname

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // DO NOT REMOVE
    createIconImportProxy() as PluginOption,
    // Custom plugin to serve .glb files before Spark plugin
    {
      name: 'glb-server',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url && (req.url.includes('.glb') || req.url.includes('.gltf'))) {
            const filePath = resolve(projectRoot, 'src/assets/models', req.url.split('/').pop() || '')
            if (fs.existsSync(filePath)) {
              res.setHeader('Content-Type', 'model/gltf-binary')
              res.setHeader('Access-Control-Allow-Origin', '*')
              fs.createReadStream(filePath).pipe(res)
              return
            }
          }
          next()
        })
      }
    } as PluginOption,
    sparkPlugin() as PluginOption,
  ],
  resolve: {
    alias: {
      '@': resolve(projectRoot, 'src')
    }
  },
  publicDir: 'public',
  assetsInclude: ['**/*.glb', '**/*.gltf'],
});
