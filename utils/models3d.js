const models = {
  truck: {
    scenegraph: 'models/truck.gltf',
    sizeScale: 10
  },
  mixer: {
    scenegraph: 'models/yellowmixer.glb',
    sizeScale: 1
  }
}

export function get3dModel (category) {
  return models[category]
}
