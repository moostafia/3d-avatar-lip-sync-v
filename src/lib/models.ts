// Import models as assets
import robotModel from '../assets/models/robot.glb?url'
import duckModel from '../assets/models/duck.glb?url'
import helmetModel from '../assets/models/helmet.glb?url'
import foxModel from '../assets/models/fox.glb?url'

export interface ModelPreset {
  id: string
  name: string
  url: string
  description: string
}

export const MODEL_PRESETS: ModelPreset[] = [
  {
    id: 'robot',
    name: 'Sci-Fi Robot',
    url: robotModel,
    description: 'Animated humanoid character'
  },
  {
    id: 'duck',
    name: 'Flying Duck',
    url: duckModel,
    description: 'Simple animated duck model'
  },
  {
    id: 'helmet',
    name: 'Damaged Helmet',
    url: helmetModel,
    description: 'PBR textured helmet'
  },
  {
    id: 'fox',
    name: 'Animated Fox',
    url: foxModel,
    description: 'Cute animated fox character'
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
