export function get3dModel (category) {
  return {
    mixer: {
      scenegraph: 'models/mixer.glb',
      sizeScale: 50,
      getOrientation: d => [0, -d.heading, 90],
      sizeMinPixels: 20
    },
    boat: {
      sizeScale: 1,
      sizeMinPixels: 1.5,
      scenegraph: 'models/boat.glb',
      getOrientation: d => [0, 180 - d.heading, 90]
    }
  }[category] || {
    scenegraph: 'models/truck.gltf',
    sizeScale: 10,
    getOrientation: d => [0, 180 - d.heading, 90]
  }
}
