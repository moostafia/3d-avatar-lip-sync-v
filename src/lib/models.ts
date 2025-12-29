export interface ModelPreset {
  id: string
  name: string
  url: string
  description: string
}

export const MODEL_PRESETS: ModelPreset[] = [
  {
    id: 'readyplayerme',
    name: 'Ready Player Me Avatar',
    url: 'https://models.readyplayer.me/6951ba830ca398caea9fc30c.glb',
    description: '3D avatar with ARKit-compatible blend shapes for lip sync'
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
