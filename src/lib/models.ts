export interface ModelPreset {
  id: string
  name: string
  url: string
  description: string
  fallback?: boolean
}

export const MODEL_PRESETS: ModelPreset[] = [
  {
    id: 'circle',
    name: 'Simple Circle Face',
    url: '2d://circle',
    description: 'Basic circular face with simple features',
    fallback: true
  },
  {
    id: 'cartoon',
    name: 'Cartoon Character',
    url: '2d://cartoon',
    description: 'Playful cartoon-style avatar',
    fallback: true
  },
  {
    id: 'robot',
    name: 'Robot/Tech Style',
    url: '2d://robot',
    description: 'Futuristic robot-themed avatar',
    fallback: true
  },
  {
    id: 'minimalist',
    name: 'Minimalist/Abstract',
    url: '2d://minimalist',
    description: 'Clean, minimal design',
    fallback: true
  }
]

export interface AudioSettings {
  sensitivity: number
  smoothing: number
  minOpen: number
  maxOpen: number
}

export const DEFAULT_SETTINGS: AudioSettings = {
  sensitivity: 2.5,
  smoothing: 0.7,
  minOpen: 0,
  maxOpen: 1
}
