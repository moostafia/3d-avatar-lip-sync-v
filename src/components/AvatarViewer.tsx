import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

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
  const modelRef = useRef<THREE.Group | null>(null)
  const mixerRef = useRef<THREE.AnimationMixer | null>(null)
  const morphTargetsRef = useRef<THREE.Mesh[]>([])
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

    const loader = new GLTFLoader()
    loader.load(
      modelUrl,
      (gltf) => {
        const model = gltf.scene
        modelRef.current = model
        sceneRef.current!.add(model)

        const box = new THREE.Box3().setFromObject(model)
        const center = box.getCenter(new THREE.Vector3())
        const size = box.getSize(new THREE.Vector3())

        model.position.x = -center.x
        model.position.y = -center.y
        model.position.z = -center.z

        const maxDim = Math.max(size.x, size.y, size.z)
        const scale = 2 / maxDim
        model.scale.setScalar(scale)

        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh
            if (mesh.morphTargetInfluences && mesh.morphTargetDictionary) {
              morphTargetsRef.current.push(mesh)
            }
          }
        })

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

      if (mixerRef.current) {
        mixerRef.current.update(0.016)
      }

      if (modelRef.current) {
        modelRef.current.rotation.y += 0.002
      }

      const targetMouthOpen = Math.min(1, audioData * settings.sensitivity)
      currentMouthOpenRef.current +=
        (targetMouthOpen - currentMouthOpenRef.current) * (1 - settings.smoothing)

      const mappedValue =
        settings.minOpen + currentMouthOpenRef.current * (settings.maxOpen - settings.minOpen)

      morphTargetsRef.current.forEach((mesh) => {
        if (!mesh.morphTargetInfluences || !mesh.morphTargetDictionary) return

        const jawIndex = Object.keys(mesh.morphTargetDictionary).findIndex(
          (key) =>
            key.toLowerCase().includes('jaw') ||
            key.toLowerCase().includes('mouth') ||
            key.toLowerCase().includes('viseme_aa') ||
            key.toLowerCase().includes('a')
        )

        if (jawIndex !== -1 && mesh.morphTargetInfluences[jawIndex] !== undefined) {
          mesh.morphTargetInfluences[jawIndex] = mappedValue
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
