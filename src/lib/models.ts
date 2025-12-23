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
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/CesiumMan/glTF/CesiumMan.gltf',
    description: 'Animated humanoid character'
  },
  {
    id: 'drone',
    name: 'Flying Drone',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Duck/glTF/Duck.gltf',
    description: 'Simple animated model'
  },
  {
    id: 'helmet',
    name: 'Damaged Helmet',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/DamagedHelmet/glTF/DamagedHelmet.gltf',
    description: 'PBR textured helmet'
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
