export interface ModelPreset {
  id: string
  name: string
  url: string
  description: string
  fallback?: boolean
}

export const MODEL_PRESETS: ModelPreset[] = [
  {
    id: 'cube',
    name: 'Simple Cube',
    url: 'fallback://cube',
    description: 'Built-in 3D cube with animation',
    fallback: true
  },
  {
    id: 'sphere',
    name: 'Simple Sphere',
    url: 'fallback://sphere',
    description: 'Built-in 3D sphere with animation',
    fallback: true
  },
  {
    id: 'torus',
    name: 'Simple Torus',
    url: 'fallback://torus',
    description: 'Built-in 3D torus with animation',
    fallback: true
  },
  {
    id: 'cone',
    name: 'Simple Cone',
    url: 'fallback://cone',
    description: 'Built-in 3D cone with animation',
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
