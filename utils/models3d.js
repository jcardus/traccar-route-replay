const models = {
  truck: {
    scenegraph: 'models/truck.gltf',
    sizeScale: 10
  },
  mixer: {
    scenegraph: 'models/mixer.glb',
    sizeScale: 75,
    getOrientation: d => [0, -d.heading, 90]
  }
}

export function get3dModel (category) {
  return models[category] || { scenegraph: 'models/truck.gltf' }
}
