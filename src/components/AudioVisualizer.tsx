import { useEffect, useRef } from 'react'

interface AudioVisualizerProps {
  audioLevel: number
  isCapturing: boolean
  className?: string
}

export function AudioVisualizer({ audioLevel, isCapturing, className = '' }: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const barsRef = useRef<number[]>(Array(32).fill(0))
  const animationFrameRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = canvas.offsetWidth * dpr
    canvas.height = canvas.offsetHeight * dpr
    ctx.scale(dpr, dpr)

    const width = canvas.offsetWidth
    const height = canvas.offsetHeight
    const barCount = barsRef.current.length
    const barWidth = width / barCount
    const padding = 1

    const animate = () => {
      ctx.clearRect(0, 0, width, height)

      if (isCapturing) {
        const targetHeight = audioLevel * height * 0.8

        barsRef.current = barsRef.current.map((current, index) => {
          const variation = Math.sin(Date.now() * 0.001 + index * 0.5) * 0.1 + 0.9
          const target = targetHeight * variation
          return current + (target - current) * 0.2
        })
      } else {
        barsRef.current = barsRef.current.map((current) => current * 0.9)
      }

      barsRef.current.forEach((barHeight, index) => {
        const x = index * barWidth
        const y = height - barHeight
        const h = barHeight

        const gradient = ctx.createLinearGradient(0, y, 0, height)
        gradient.addColorStop(0, 'oklch(0.75 0.15 195)')
        gradient.addColorStop(1, 'oklch(0.55 0.12 195)')

        ctx.fillStyle = gradient
        ctx.fillRect(x + padding, y, barWidth - padding * 2, h)
      })

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [audioLevel, isCapturing])

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-16 rounded-md bg-secondary/30 ${className}`}
    />
  )
}
