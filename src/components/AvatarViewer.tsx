import { useEffect, useRef } from 'react'
import { Avatar2DRenderer } from '../lib/avatar2d'

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
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<Avatar2DRenderer | null>(null)
  const currentMouthOpenRef = useRef(0)
  const animationFrameRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const resizeCanvas = () => {
      const container = canvas.parentElement
      if (container) {
        canvas.width = container.clientWidth
        canvas.height = container.clientHeight
      }
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!canvasRef.current) return

    // Handle 2D avatar models
    if (modelUrl.startsWith('2d://')) {
      const styleId = modelUrl.replace('2d://', '')
      
      try {
        if (!rendererRef.current) {
          rendererRef.current = new Avatar2DRenderer(canvasRef.current, styleId)
        } else {
          rendererRef.current.setStyle(styleId)
        }
        onModelLoad?.(true)
      } catch (error) {
        console.error('Error creating 2D avatar:', error)
        onModelLoad?.(false)
      }
      return
    }

    // If not a 2D model, it's unsupported in this version
    console.warn('Only 2D avatars are supported in this version. External GLTF/GLB models are no longer supported. Use modelUrl with "2d://" prefix.')
    onModelLoad?.(false)
  }, [modelUrl, onModelLoad])

  useEffect(() => {
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate)

      if (rendererRef.current) {
        // Calculate target mouth open based on audio
        const targetMouthOpen = Math.min(1, audioData * settings.sensitivity)
        
        // Smooth transition
        currentMouthOpenRef.current +=
          (targetMouthOpen - currentMouthOpenRef.current) * (1 - settings.smoothing)

        // Map to min/max range
        const mappedValue =
          settings.minOpen + currentMouthOpenRef.current * (settings.maxOpen - settings.minOpen)

        // Render the 2D avatar
        rendererRef.current.render(mappedValue)
      }
    }

    animate()

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [audioData, settings])

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-full bg-[#0a0a0f] ${className}`}
    />
  )
}
