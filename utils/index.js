import circle from '@turf/circle'
import { parse } from 'wellknown'

export function closest (arr, target) {
  if (!arr || !arr.length) { return null }
  if (arr.length === 1) { return arr[0] }
  for (let i = 1; i < arr.length; i++) {
    // As soon as a number bigger than target is found, return the previous or current
    // number depending on which has smaller difference to the target.
    if (arr[i] > target) {
      const p = arr[i - 1]
      const c = arr[i]
      return Math.abs(p - target) < Math.abs(c - target) ? i - 1 : i
    }
  }
  // No number in array is bigger so return the last.
  return arr.length - 1
}

export const geofenceToFeature = (theme, item) => {
  let geometry
  if (item.area.includes('CIRCLE')) {
    const coordinates = item.area.replace(/CIRCLE|\(|\)|,/g, ' ').trim().split(/ +/)
    const options = { steps: 32, units: 'meters' }
    const polygon = circle([Number(coordinates[1]), Number(coordinates[0])], Number(coordinates[2]), options)
    geometry = polygon.geometry
  } else {
    geometry = reverseCoordinates(parse(item.area))
  }
  return {
    id: item.id,
    type: 'Feature',
    geometry,
    properties: {
      name: item.name,
      color: item.attributes.color || theme.palette.geometry.main
    }
  }
}

export const reverseCoordinates = (it) => {
  if (!it) {
    return it
  } if (Array.isArray(it)) {
    if (it.length === 2 && typeof it[0] === 'number' && typeof it[1] === 'number') {
      return [it[1], it[0]]
    }
    return it.map(it => reverseCoordinates(it))
  }
  return {
    ...it,
    coordinates: reverseCoordinates(it.coordinates)
  }
}
