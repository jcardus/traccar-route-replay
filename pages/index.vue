<template>
  <div id="map" style="height: 100%; width: 100%" />
</template>

<script>
import mapboxgl from 'mapbox-gl'
import { TripsLayer } from '@deck.gl/geo-layers'
import { MapboxOverlay } from '@deck.gl/mapbox'
import { mapGetters } from 'vuex'
import bbox from '@turf/bbox'
import { lineString } from '@turf/helpers'

// const data = 'https://raw.githubusercontent.com/visgl/deck.gl-data/master/examples/trips/trips-v7.json'
const trailLength = 2 * 60 * 60 * 1000
// const animationSpeed = 1

let map
let deckOverlay
const props = {
  id: 'trips',
  getPath: d => d.path,
  getTimestamps: d => d.timestamps,
  opacity: 1,
  widthMinPixels: 8,
  rounded: true,
  joinRounded: true,
  trailLength,
  shadowEnabled: true,
  getColor: [253, 128, 93]
}
export default {
  name: 'IndexPage',
  data () {
    return {
      time: 0,
      device: {},
      date: new Date().getTime() - 1000 * 60 * 60 * 24,
      loopLength: 1800,
      route: [],
      i: 0,
      timestamps: []
    }
  },
  computed: {
    ...mapGetters(['devices'])
  },
  async mounted () {
    mapboxgl.accessToken = process.env.MAPBOX_ACCESS_TOKEN
    map = new mapboxgl.Map({
      container: 'map', // container ID
      style: 'mapbox://styles/mapbox/streets-v12', // style URL
      zoom: 9 // starting zoom
    })
    map.addControl(new mapboxgl.NavigationControl())
    const from = new Date(this.date).toISOString()
    const to = new Date(new Date(this.date).getTime() + 1000 * 60 * 60 * 24).toISOString()
    await this.$store.dispatch('getUserData')
    const device = this.devices[2]
    this.route = await this.$axios.$get(`/reports/route?deviceId=${device.id}&from=${from}&to=${to}&type=route&type=trips`)
    const path = this.route.map(p => [p.longitude, p.latitude])
    const timestamps = this.route.map(p => new Date(p.fixTime).getTime())
    props.data = [{
      path,
      timestamps
    }]
    map.fitBounds(bbox(lineString(path)))
    deckOverlay = new MapboxOverlay({
      layers: [new TripsLayer({ ...props, currentTime: timestamps.slice(-1)[0] })]
    })
    map.addSource('route', {
      type: 'geojson',
      data: lineString(path)
    })
    // map.addLayer({ id: 'route', type: 'line', source: 'route' })
    map.addControl(deckOverlay)
    this.setTime()
  },
  methods: {
    setTime () {
      if (this.i < this.route.length) {
        deckOverlay.setProps({
          layers: [new TripsLayer({
            ...props,
            currentTime: new Date(this.route[this.i++].fixTime).getTime()
          })]
        })
        window.requestAnimationFrame(this.setTime)
      } else {
        setTimeout(() => deckOverlay.setProps({ layers: [] }), 5000)
      }
    }
  }
}
</script>
