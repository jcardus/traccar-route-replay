<template>
  <div id="map" style="height: 100%; width: 100%" />
</template>

<script>
import mapboxgl from 'mapbox-gl'
import { TripsLayer } from '@deck.gl/geo-layers'
import { MapboxOverlay } from '@deck.gl/mapbox'

const data = 'https://raw.githubusercontent.com/visgl/deck.gl-data/master/examples/trips/trips-v7.json'
const trailLength = 180
const animationSpeed = 1
const loopLength = 1800
let map
let deckOverlay
const props = {
  id: 'trips',
  data,
  getPath: d => d.path,
  getTimestamps: d => d.timestamps,
  opacity: 0.3,
  widthMinPixels: 2,
  rounded: true,
  trailLength,
  currentTime: 0,
  shadowEnabled: false,
  getColor: d => (d.vendor === 0 ? [253, 128, 93] : [23, 184, 190])
}
export default {
  name: 'IndexPage',
  data () {
    return {
      time: 0,
      animation: {}
    }
  },
  mounted () {
    mapboxgl.accessToken = process.env.MAPBOX_ACCESS_TOKEN
    map = new mapboxgl.Map({
      container: 'map', // container ID
      style: 'mapbox://styles/mapbox/streets-v12', // style URL
      center: [-74.5, 40], // starting position [lng, lat]
      zoom: 9 // starting zoom
    })
    deckOverlay = new MapboxOverlay({
      layers: []
    })
    map.addControl(deckOverlay)
    map.addControl(new mapboxgl.NavigationControl())
    this.setTime()
  },
  methods: {
    setTime () {
      this.time = (this.time + animationSpeed) % loopLength
      const tripsLayer = new TripsLayer({
        ...props,
        currentTime: this.time
      })
      deckOverlay.setProps({
        layers: [tripsLayer]
      })
      this.animation.id = window.requestAnimationFrame(this.setTime)
    }
  }
}
</script>
