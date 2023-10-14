<template>
  <div style="height: 100%; width: 100%">
    <div id="map" style="height: 100%; width: 100%" />
    <div id="slider" ref="slider" class="maplibregl-ctrl maplibregl-ctrl-group mapboxgl-ctrl-timeline">
      <div class="mapboxgl-ctrl-timeline__control">
        <button
          class="mapboxgl-ctrl-timeline__toggler"
          :class="playing ? 'running' : ''"
          @click="playing = !playing"
        />
        <input
          class="
          mapboxgl-ctrl-timeline__slider"
          type="range"
        >
      </div>
      <div class="mapboxgl-ctrl-timeline__label">
        {{ new Date().toLocaleString() }}
      </div>
    </div>
  </div>
</template>

<script>
import maplibregl from 'maplibre-gl'
import { TripsLayer } from '@deck.gl/geo-layers'
// import { MapboxOverlay } from '@deck.gl/mapbox'
import { mapGetters } from 'vuex'
// const animationSpeed = 1
// import bbox from '@turf/bbox'
// import { lineString } from '@turf/helpers'

// const data = 'https://raw.githubusercontent.com/visgl/deck.gl-data/master/examples/trips/trips-v7.json'
const trailLength = 2 * 60 * 60 * 1000

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
      playing: false,
      time: 0,
      device: {},
      date: new Date().getTime() - 1000 * 60 * 60 * 24,
      loopLength: 1800,
      route: [],
      i: 0,
      timestamps: [],
      curTime: '00:00'
    }
  },
  computed: {
    ...mapGetters(['devices'])
  },
  mounted () {
    // mapboxgl.accessToken = process.env.MAPBOX_ACCESS_TOKEN
    map = new maplibregl.Map({
      container: 'map', // container ID
      style: `https://api.maptiler.com/maps/basic-v2/style.json?key=${process.env.MAPTILER_KEY}`,
      // style: 'mapbox://styles/mapbox/streets-v12', // style URL
      zoom: localStorage.getItem('zoom'),
      center: localStorage.getItem('center') ? JSON.parse(localStorage.getItem('center')) : [0, 0]
    })
    map.addControl(new maplibregl.NavigationControl())
    map.on('moveend', () => {
      localStorage.setItem('center', JSON.stringify(map.getCenter()))
      localStorage.setItem('zoom', map.getZoom())
    })
    map.addControl({ onAdd: () => this.$refs.slider }, 'top-left')
    // map.fitBounds(bbox(lineString(path)))
    /* deckOverlay = new MapboxOverlay({
      layers: [new TripsLayer({ ...props, currentTime: timestamps.slice(-1)[0] })]
    })

    map.addSource('route', {
      type: 'geojson',
      data: lineString(path)
    })
    map.addLayer({ id: 'route', type: 'line', source: 'route' })
    map.addControl(deckOverlay)
    */
    // this.setTime()
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
