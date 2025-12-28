// 2D Avatar rendering utilities

export interface Avatar2DStyle {
  id: string
  name: string
  description: string
  colors: {
    face: string
    eyes: string
    mouth: string
    accent: string
  }
}

export const AVATAR_STYLES: Record<string, Avatar2DStyle> = {
  circle: {
    id: 'circle',
    name: 'Simple Circle Face',
    description: 'Basic circular face with simple features',
    colors: {
      face: '#FFE0BD',
      eyes: '#2C3E50',
      mouth: '#E74C3C',
      accent: '#34495E'
    }
  },
  cartoon: {
    id: 'cartoon',
    name: 'Cartoon Character',
    description: 'Playful cartoon-style avatar',
    colors: {
      face: '#FFEAA7',
      eyes: '#0984E3',
      mouth: '#D63031',
      accent: '#FDCB6E'
    }
  },
  robot: {
    id: 'robot',
    name: 'Robot/Tech Style',
    description: 'Futuristic robot-themed avatar',
    colors: {
      face: '#74B9FF',
      eyes: '#00FFFF',
      mouth: '#FF00FF',
      accent: '#A29BFE'
    }
  },
  minimalist: {
    id: 'minimalist',
    name: 'Minimalist/Abstract',
    description: 'Clean, minimal design',
    colors: {
      face: '#FFFFFF',
      eyes: '#2D3436',
      mouth: '#636E72',
      accent: '#DFE6E9'
    }
  }
}

export class Avatar2DRenderer {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private style: Avatar2DStyle
  private blinkTimer: number = 0
  private isBlinking: boolean = false
  private blinkDuration: number = 0
  private nextBlinkTime: number = 180 // Frames until next blink

  constructor(canvas: HTMLCanvasElement, styleId: string) {
    this.canvas = canvas
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Could not get 2D context')
    this.ctx = ctx
    this.style = AVATAR_STYLES[styleId] || AVATAR_STYLES.circle
  }

  setStyle(styleId: string) {
    this.style = AVATAR_STYLES[styleId] || AVATAR_STYLES.circle
  }

  private updateBlinking() {
    this.blinkTimer++
    
    // Check if it's time to blink
    if (!this.isBlinking && this.blinkTimer >= this.nextBlinkTime) {
      this.isBlinking = true
      this.blinkDuration = 8 // Blink for ~8 frames
      this.blinkTimer = 0
      // Schedule next blink for 120-240 frames (2-4 seconds at 60fps)
      this.nextBlinkTime = Math.floor(Math.random() * 120 + 120)
    }
    
    if (this.isBlinking) {
      this.blinkDuration--
      if (this.blinkDuration <= 0) {
        this.isBlinking = false
      }
    }
  }

  // Helper method to draw rounded rectangle with fallback
  private drawRoundedRect(x: number, y: number, width: number, height: number, radius: number) {
    const ctx = this.ctx
    
    // Use roundRect if available, otherwise use arc fallback
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(x, y, width, height, radius)
    } else {
      // Manual rounded rectangle using arcs
      ctx.moveTo(x + radius, y)
      ctx.lineTo(x + width - radius, y)
      ctx.arcTo(x + width, y, x + width, y + radius, radius)
      ctx.lineTo(x + width, y + height - radius)
      ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius)
      ctx.lineTo(x + radius, y + height)
      ctx.arcTo(x, y + height, x, y + height - radius, radius)
      ctx.lineTo(x, y + radius)
      ctx.arcTo(x, y, x + radius, y, radius)
    }
  }

  render(mouthOpenAmount: number) {
    const { width, height } = this.canvas
    const ctx = this.ctx
    const centerX = width / 2
    const centerY = height / 2

    // Clear canvas
    ctx.clearRect(0, 0, width, height)

    // Update blinking animation
    this.updateBlinking()

    switch (this.style.id) {
      case 'circle':
        this.renderCircleFace(centerX, centerY, mouthOpenAmount)
        break
      case 'cartoon':
        this.renderCartoonFace(centerX, centerY, mouthOpenAmount)
        break
      case 'robot':
        this.renderRobotFace(centerX, centerY, mouthOpenAmount)
        break
      case 'minimalist':
        this.renderMinimalistFace(centerX, centerY, mouthOpenAmount)
        break
    }
  }

  private renderCircleFace(x: number, y: number, mouthOpen: number) {
    const ctx = this.ctx
    const size = Math.min(this.canvas.width, this.canvas.height) * 0.4

    // Face outline
    ctx.fillStyle = this.style.colors.face
    ctx.strokeStyle = this.style.colors.accent
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.arc(x, y, size, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()

    // Eyes
    const eyeY = y - size * 0.2
    const eyeSize = this.isBlinking ? size * 0.02 : size * 0.1
    const eyeHeight = this.isBlinking ? size * 0.02 : size * 0.1

    ctx.fillStyle = this.style.colors.eyes
    // Left eye
    ctx.beginPath()
    ctx.ellipse(x - size * 0.3, eyeY, size * 0.1, eyeHeight, 0, 0, Math.PI * 2)
    ctx.fill()
    // Right eye
    ctx.beginPath()
    ctx.ellipse(x + size * 0.3, eyeY, size * 0.1, eyeHeight, 0, 0, Math.PI * 2)
    ctx.fill()

    // Mouth
    const mouthY = y + size * 0.3
    const mouthWidth = size * 0.4
    const mouthHeight = size * 0.3 * mouthOpen

    ctx.fillStyle = this.style.colors.mouth
    ctx.beginPath()
    ctx.ellipse(x, mouthY, mouthWidth, mouthHeight, 0, 0, Math.PI)
    ctx.fill()
  }

  private renderCartoonFace(x: number, y: number, mouthOpen: number) {
    const ctx = this.ctx
    const size = Math.min(this.canvas.width, this.canvas.height) * 0.4

    // Face outline (rounded)
    ctx.fillStyle = this.style.colors.face
    ctx.strokeStyle = this.style.colors.accent
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.ellipse(x, y, size * 1.1, size, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()

    // Eyes - larger and more expressive
    const eyeY = y - size * 0.25
    const eyeSize = size * 0.15

    ctx.fillStyle = '#FFFFFF'
    ctx.strokeStyle = this.style.colors.accent
    ctx.lineWidth = 3
    
    // Left eye
    ctx.beginPath()
    ctx.arc(x - size * 0.35, eyeY, eyeSize, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    
    // Right eye
    ctx.beginPath()
    ctx.arc(x + size * 0.35, eyeY, eyeSize, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()

    // Pupils
    if (!this.isBlinking) {
      ctx.fillStyle = this.style.colors.eyes
      ctx.beginPath()
      ctx.arc(x - size * 0.35, eyeY, eyeSize * 0.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(x + size * 0.35, eyeY, eyeSize * 0.5, 0, Math.PI * 2)
      ctx.fill()
    }

    // Eyelids when blinking
    if (this.isBlinking) {
      ctx.strokeStyle = this.style.colors.accent
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(x - size * 0.5, eyeY)
      ctx.lineTo(x - size * 0.2, eyeY)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(x + size * 0.2, eyeY)
      ctx.lineTo(x + size * 0.5, eyeY)
      ctx.stroke()
    }

    // Mouth - more rounded
    const mouthY = y + size * 0.35
    const mouthWidth = size * 0.5
    const mouthHeight = size * 0.4 * mouthOpen

    ctx.fillStyle = this.style.colors.mouth
    ctx.strokeStyle = this.style.colors.accent
    ctx.lineWidth = 3
    ctx.beginPath()
    
    if (mouthOpen > 0.3) {
      // Open mouth - oval
      ctx.ellipse(x, mouthY, mouthWidth * 0.6, mouthHeight, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
    } else {
      // Closed mouth - smile line
      ctx.beginPath()
      ctx.moveTo(x - mouthWidth * 0.5, mouthY)
      ctx.quadraticCurveTo(x, mouthY + size * 0.1, x + mouthWidth * 0.5, mouthY)
      ctx.stroke()
    }
  }

  private renderRobotFace(x: number, y: number, mouthOpen: number) {
    const ctx = this.ctx
    const size = Math.min(this.canvas.width, this.canvas.height) * 0.4

    // Face outline (rectangular with rounded corners)
    ctx.fillStyle = this.style.colors.face
    ctx.strokeStyle = this.style.colors.accent
    ctx.lineWidth = 4
    
    const faceWidth = size * 1.4
    const faceHeight = size * 1.2
    const cornerRadius = size * 0.2
    
    ctx.beginPath()
    this.drawRoundedRect(x - faceWidth / 2, y - faceHeight / 2, faceWidth, faceHeight, cornerRadius)
    ctx.fill()
    ctx.stroke()

    // Eyes - rectangular screens
    const eyeY = y - size * 0.3
    const eyeWidth = size * 0.3
    const eyeHeight = this.isBlinking ? size * 0.05 : size * 0.2

    ctx.fillStyle = this.style.colors.eyes
    ctx.strokeStyle = this.style.colors.accent
    ctx.lineWidth = 3
    
    // Left eye
    ctx.fillRect(x - size * 0.5, eyeY - eyeHeight / 2, eyeWidth, eyeHeight)
    ctx.strokeRect(x - size * 0.5, eyeY - eyeHeight / 2, eyeWidth, eyeHeight)
    
    // Right eye
    ctx.fillRect(x + size * 0.2, eyeY - eyeHeight / 2, eyeWidth, eyeHeight)
    ctx.strokeRect(x + size * 0.2, eyeY - eyeHeight / 2, eyeWidth, eyeHeight)

    // Antenna
    ctx.strokeStyle = this.style.colors.accent
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(x, y - faceHeight / 2)
    ctx.lineTo(x, y - faceHeight / 2 - size * 0.3)
    ctx.stroke()
    
    ctx.fillStyle = this.style.colors.mouth
    ctx.beginPath()
    ctx.arc(x, y - faceHeight / 2 - size * 0.3, size * 0.08, 0, Math.PI * 2)
    ctx.fill()

    // Mouth - LED bar style
    const mouthY = y + size * 0.4
    const mouthWidth = size * 0.8
    const mouthHeight = size * 0.1 + size * 0.3 * mouthOpen

    ctx.fillStyle = this.style.colors.mouth
    ctx.fillRect(x - mouthWidth / 2, mouthY - mouthHeight / 2, mouthWidth, mouthHeight)
    ctx.strokeRect(x - mouthWidth / 2, mouthY - mouthHeight / 2, mouthWidth, mouthHeight)
    
    // LED segments
    const segments = 5
    const segmentWidth = mouthWidth / segments
    ctx.fillStyle = this.style.colors.eyes
    for (let i = 0; i < segments; i++) {
      if (i / segments < mouthOpen) {
        ctx.fillRect(
          x - mouthWidth / 2 + i * segmentWidth + 2,
          mouthY - mouthHeight / 2 + 2,
          segmentWidth - 4,
          mouthHeight - 4
        )
      }
    }
  }

  private renderMinimalistFace(x: number, y: number, mouthOpen: number) {
    const ctx = this.ctx
    const size = Math.min(this.canvas.width, this.canvas.height) * 0.4

    // Face outline (simple circle)
    ctx.strokeStyle = this.style.colors.accent
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(x, y, size, 0, Math.PI * 2)
    ctx.stroke()

    // Eyes - minimalist dots or lines
    const eyeY = y - size * 0.2
    const eyeSize = size * 0.08

    ctx.fillStyle = this.style.colors.eyes
    
    if (this.isBlinking) {
      // Horizontal lines for blinking
      ctx.lineWidth = 2
      ctx.strokeStyle = this.style.colors.eyes
      ctx.beginPath()
      ctx.moveTo(x - size * 0.35, eyeY)
      ctx.lineTo(x - size * 0.25, eyeY)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(x + size * 0.25, eyeY)
      ctx.lineTo(x + size * 0.35, eyeY)
      ctx.stroke()
    } else {
      // Simple dots
      ctx.beginPath()
      ctx.arc(x - size * 0.3, eyeY, eyeSize, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(x + size * 0.3, eyeY, eyeSize, 0, Math.PI * 2)
      ctx.fill()
    }

    // Mouth - simple line or arc
    const mouthY = y + size * 0.3
    const mouthWidth = size * 0.5

    ctx.strokeStyle = this.style.colors.mouth
    ctx.lineWidth = 2
    ctx.beginPath()
    
    if (mouthOpen > 0.3) {
      // Open mouth - oval
      const mouthHeight = size * 0.3 * mouthOpen
      ctx.ellipse(x, mouthY, mouthWidth * 0.5, mouthHeight, 0, 0, Math.PI * 2)
      ctx.stroke()
    } else {
      // Closed mouth - horizontal line
      ctx.moveTo(x - mouthWidth * 0.5, mouthY)
      ctx.lineTo(x + mouthWidth * 0.5, mouthY)
      ctx.stroke()
    }
  }
}
