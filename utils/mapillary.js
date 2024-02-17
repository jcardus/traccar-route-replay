import axios from 'axios'
import bbox from '@turf/bbox'
import { feature, featureCollection, lineString, point } from '@turf/helpers'
import booleanPointInPolygon from '@turf/boolean-point-in-polygon'
import nearestPoint from '@turf/nearest-point'
import squareGrid from '@turf/square-grid'

const baseUrl = `https://graph.mapillary.com/images?access_token=${
  process.env.MAPILLARY_ACCESS_TOKEN}&fields=computed_geometry,computed_compass_angle,id,thumb_256_url&limit=5000`
let bboxes
const images = {}
const cellSide = 3
const maxImageDistance = 20 // meters
export function init (bounds, path, map) {
  const { features } = squareGrid(bounds, cellSide, { mask: lineString(path) })
  bboxes = features
  if (process.env.DEBUG_BOXES) {
    map.addSource('test', {
      type: 'geojson',
      data: featureCollection(features)
    })
    map.addLayer({
      id: 'test',
      type: 'fill',
      source: 'test'
    })
  }
}

export function getImage (p, course) {
  if (!bboxes) { return }
  const filtered = bboxes.filter(f => booleanPointInPolygon(point(p), f))
  if (filtered.length) {
    const [box] = filtered
    if (!box.properties.loading) {
      box.properties.loading = true
      axios.get(baseUrl + `&bbox=${bbox(box).join(',')}`)
        .then((d) => { images[box.properties.id] = d.data.data })
    }
    if (images[box.properties.id] && images[box.properties.id].length) {
      const points = images[box.properties.id]
        .filter(p => Math.abs(p.computed_compass_angle - course) < 8)
      if (points.length) {
        const nearest = nearestPoint(
          point(p),
          featureCollection(points.map(p => feature(p.computed_geometry))),
          { units: 'meters' }
        )
        if (nearest.properties.distanceToPoint < maxImageDistance) {
          return points[nearest.properties.featureIndex]
        }
      }
    }
  }
  return {}
}
