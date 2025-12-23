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
  },
  {
    id: 'fox',
    name: 'Animated Fox',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Fox/glTF/Fox.gltf',
    description: 'Cute animated fox character'
  },
  {
    id: 'brain',
    name: 'Brain Stem',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/BrainStem/glTF/BrainStem.gltf',
    description: 'Medical model with animation'
  },
  {
    id: 'lantern',
    name: 'Lantern',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Lantern/glTF/Lantern.gltf',
    description: 'Vintage lantern model'
  },
  {
    id: 'buggy',
    name: 'Moon Buggy',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/CesiumMilkTruck/glTF/CesiumMilkTruck.gltf',
    description: 'Classic milk truck'
  },
  {
    id: 'monster',
    name: 'Monster',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Monster/glTF/Monster.gltf',
    description: 'Animated monster character'
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
