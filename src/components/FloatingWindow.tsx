import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, ArrowsOutSimple, Minus } from '@phosphor-icons/react'
import { Button } from './ui/button'
import { Card } from './ui/card'

interface FloatingWindowProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  title: string
  initialWidth?: number
  initialHeight?: number
}

export function FloatingWindow({
  isOpen,
  onClose,
  children,
  title,
  initialWidth = 400,
  initialHeight = 500
}: FloatingWindowProps) {
  const [position, setPosition] = useState({ x: 100, y: 100 })
  const [size, setSize] = useState({ width: initialWidth, height: initialHeight })
  const [isDragging, setIsDragging] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const windowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      const centerX = (window.innerWidth - size.width) / 2
      const centerY = (window.innerHeight - size.height) / 2
      setPosition({ x: Math.max(0, centerX), y: Math.max(0, centerY) })
    }
  }, [isOpen])

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      const newX = e.clientX - dragOffset.x
      const newY = e.clientY - dragOffset.y

      const maxX = window.innerWidth - size.width
      const maxY = window.innerHeight - size.height

      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      })
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, dragOffset, size])

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === windowRef.current || (e.target as HTMLElement).closest('[data-drag-handle]')) {
      setIsDragging(true)
      const rect = windowRef.current?.getBoundingClientRect()
      if (rect) {
        setDragOffset({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        })
      }
    }
  }

  if (!isOpen) return null

  const windowContent = (
    <div
      ref={windowRef}
      className="fixed z-[9999] shadow-2xl animate-in fade-in duration-300"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: isMinimized ? 'auto' : `${size.height}px`,
        cursor: isDragging ? 'grabbing' : 'auto'
      }}
      onMouseDown={handleMouseDown}
    >
      <Card className="h-full flex flex-col border-accent/40 overflow-hidden bg-card/95 backdrop-blur-sm">
        <div
          data-drag-handle
          className="flex items-center justify-between p-3 border-b border-accent/20 cursor-grab active:cursor-grabbing bg-primary/10"
        >
          <div className="flex items-center gap-2">
            <ArrowsOutSimple className="text-accent" size={16} />
            <h3 className="text-sm font-semibold text-accent">{title}</h3>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setIsMinimized(!isMinimized)}
            >
              <Minus size={14} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={onClose}
            >
              <X size={14} />
            </Button>
          </div>
        </div>
        {!isMinimized && (
          <div className="flex-1 overflow-hidden">
            {children}
          </div>
        )}
      </Card>
    </div>
  )

  return createPortal(windowContent, document.body)
}
