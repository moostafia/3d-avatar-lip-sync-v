import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

interface AvatarViewerProps {
  modelUrl: string
  audioData: number
  settings: {
    sensitivity: number
    smoothing: number
    minOpen: number
    maxOpen: number
  }
  onModelLoad?: (success: boolean) => void
  className?: string
}

interface MorphTargetIndices {
  mesh: THREE.SkinnedMesh
  jawOpen?: number
  viseme_aa?: number
  viseme_O?: number
  viseme_E?: number
  viseme_I?: number
  viseme_U?: number
  mouthSmile?: number
}

export function AvatarViewer({
  modelUrl,
  audioData,
  settings,
  onModelLoad,
  className = ''
}: AvatarViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)
  const modelRef = useRef<THREE.Group | null>(null)
  const mixerRef = useRef<THREE.AnimationMixer | null>(null)
  const morphTargetsRef = useRef<MorphTargetIndices[]>([])
  const currentMouthOpenRef = useRef(0)
  const animationFrameRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    if (!containerRef.current) return

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0a0a0f)
    sceneRef.current = scene

    const camera = new THREE.PerspectiveCamera(
      45,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    )
    camera.position.set(0, 1.6, 3)
    camera.lookAt(0, 1.6, 0)
    cameraRef.current = camera

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    rendererRef.current = renderer
    containerRef.current.appendChild(renderer.domElement)

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    scene.add(ambientLight)

    const keyLight = new THREE.DirectionalLight(0xffffff, 1)
    keyLight.position.set(5, 5, 5)
    keyLight.castShadow = true
    scene.add(keyLight)

    const fillLight = new THREE.DirectionalLight(0x4dd4ff, 0.3)
    fillLight.position.set(-5, 0, -5)
    scene.add(fillLight)

    const rimLight = new THREE.DirectionalLight(0x4dd4ff, 0.5)
    rimLight.position.set(0, 5, -5)
    scene.add(rimLight)

    // Add OrbitControls for camera manipulation
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.minDistance = 1
    controls.maxDistance = 10
    controls.target.set(0, 1.6, 0)
    controls.update()
    controlsRef.current = controls

    const handleResize = () => {
      if (!containerRef.current || !camera || !renderer) return
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (controlsRef.current) {
        controlsRef.current.dispose()
      }
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement)
      }
      rendererRef.current?.dispose()
    }
  }, [])

  useEffect(() => {
    if (!sceneRef.current) return

    if (modelRef.current) {
      sceneRef.current.remove(modelRef.current)
      modelRef.current = null
      morphTargetsRef.current = []
    }

    // Load GLTF/GLB model
    const loader = new GLTFLoader()
    loader.load(
      modelUrl,
      (gltf) => {
        const model = gltf.scene
        modelRef.current = model
        sceneRef.current!.add(model)

        // Center and scale the model
        const box = new THREE.Box3().setFromObject(model)
        const center = box.getCenter(new THREE.Vector3())
        const size = box.getSize(new THREE.Vector3())

        model.position.x = -center.x
        model.position.y = -center.y
        model.position.z = -center.z

        const maxDim = Math.max(size.x, size.y, size.z)
        const scale = 2 / maxDim
        model.scale.setScalar(scale)

        // Find and store references to meshes with morph targets (Ready Player Me blend shapes)
        model.traverse((child) => {
          if (child instanceof THREE.SkinnedMesh && child.morphTargetDictionary) {
            const dict = child.morphTargetDictionary
            const morphTarget: MorphTargetIndices = { mesh: child }

            // Map ARKit-compatible blend shapes
            if (dict['jawOpen'] !== undefined) morphTarget.jawOpen = dict['jawOpen']
            if (dict['viseme_aa'] !== undefined) morphTarget.viseme_aa = dict['viseme_aa']
            if (dict['viseme_O'] !== undefined) morphTarget.viseme_O = dict['viseme_O']
            if (dict['viseme_E'] !== undefined) morphTarget.viseme_E = dict['viseme_E']
            if (dict['viseme_I'] !== undefined) morphTarget.viseme_I = dict['viseme_I']
            if (dict['viseme_U'] !== undefined) morphTarget.viseme_U = dict['viseme_U']
            if (dict['mouthSmile'] !== undefined) morphTarget.mouthSmile = dict['mouthSmile']

            morphTargetsRef.current.push(morphTarget)
            console.log('Found morph targets:', Object.keys(dict))
          }
        })

        // Play idle/breathing animations if available
        if (gltf.animations && gltf.animations.length > 0) {
          mixerRef.current = new THREE.AnimationMixer(model)
          const idleAnimation = gltf.animations.find(
            (clip) => clip.name.toLowerCase().includes('idle') || clip.name.toLowerCase().includes('breath')
          )
          if (idleAnimation) {
            const action = mixerRef.current.clipAction(idleAnimation)
            action.play()
          }
        }

        onModelLoad?.(true)
      },
      undefined,
      (error) => {
        console.error('Error loading model:', error)
        onModelLoad?.(false)
      }
    )
  }, [modelUrl, onModelLoad])

  useEffect(() => {
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate)

      // Update animation mixer for idle animations
      if (mixerRef.current) {
        mixerRef.current.update(0.016)
      }

      // Update orbit controls
      if (controlsRef.current) {
        controlsRef.current.update()
      }

      // Calculate smoothed mouth opening value
      const targetMouthOpen = Math.min(1, audioData * settings.sensitivity)
      currentMouthOpenRef.current +=
        (targetMouthOpen - currentMouthOpenRef.current) * (1 - settings.smoothing)

      const mouthOpen =
        settings.minOpen + currentMouthOpenRef.current * (settings.maxOpen - settings.minOpen)

      // Apply morph targets to Ready Player Me avatar
      morphTargetsRef.current.forEach((morphTarget) => {
        const influences = morphTarget.mesh.morphTargetInfluences
        if (!influences) return

        // Primary mouth opening - jawOpen and viseme_aa
        if (morphTarget.jawOpen !== undefined) {
          influences[morphTarget.jawOpen] = mouthOpen * 0.7
        }
        if (morphTarget.viseme_aa !== undefined) {
          influences[morphTarget.viseme_aa] = mouthOpen
        }

        // Vary between different visemes based on audio level for more natural movement
        const visemeVariation = Math.sin(Date.now() * 0.003) * 0.5 + 0.5
        
        if (morphTarget.viseme_O !== undefined) {
          influences[morphTarget.viseme_O] = mouthOpen * 0.3 * visemeVariation
        }
        if (morphTarget.viseme_E !== undefined) {
          influences[morphTarget.viseme_E] = mouthOpen * 0.2 * (1 - visemeVariation)
        }
        if (morphTarget.viseme_I !== undefined) {
          influences[morphTarget.viseme_I] = mouthOpen * 0.15
        }
        if (morphTarget.viseme_U !== undefined) {
          influences[morphTarget.viseme_U] = mouthOpen * 0.25 * visemeVariation
        }

        // Add slight smile when speaking
        if (morphTarget.mouthSmile !== undefined) {
          influences[morphTarget.mouthSmile] = mouthOpen * 0.1
        }
      })

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current)
      }
    }

    animate()

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [audioData, settings])

  return <div ref={containerRef} className={`w-full h-full ${className}`} />
}
