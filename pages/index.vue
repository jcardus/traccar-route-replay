<template>
  <div style="height: 100%; width: 100%">
    <loading :active="loading" />
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
import { mapGetters } from 'vuex'
import bbox from '@turf/bbox'
import { lineString } from '@turf/helpers'
import { MapboxOverlay } from '@deck.gl/mapbox'
import Loading from 'vue-loading-overlay'

// const data = 'https://raw.githubusercontent.com/visgl/deck.gl-data/master/examples/trips/trips-v7.json'
const trailLength = 2 * 60 * 60 * 1000
const overlay = new MapboxOverlay({
  layers: []
})

// mapboxgl.accessToken = process.env.MAPBOX_ACCESS_TOKEN

let map
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
  components: { Loading },
  data () {
    return {
      loading: false,
      playing: false,
      i: 0
    }
  },
  computed: {
    ...mapGetters(['devices', 'path', 'timestamps'])
  },
  watch: {
    path () {
      this.loading = false
      this.addLayers()
      map.fitBounds(bbox(lineString(this.path)))
    },
    playing () {
      if (this.playing) {
        props.data = [{
          path: this.path,
          timestamps: this.timestamps
        }]
        this.start()
      }
    }
  },
  mounted () {
    this.loading = true
    map = new maplibregl.Map({
      container: 'map', // container ID
      style: `https://api.maptiler.com/maps/basic-v2/style.json?key=${process.env.MAPTILER_KEY}`,
      // style: 'mapbox://styles/mapbox/streets-v12', // style URL
      zoom: localStorage.getItem('zoom'),
      center: localStorage.getItem('center') ? JSON.parse(localStorage.getItem('center')) : [0, 0]
    })
    map.on('moveend', () => {
      localStorage.setItem('center', JSON.stringify(map.getCenter()))
      localStorage.setItem('zoom', map.getZoom())
    })
    map.on('load', () => this.$store.dispatch('getPath'))
    map.addControl(new maplibregl.NavigationControl())
    map.addControl({ onAdd: () => this.$refs.slider }, 'top-left')
    map.addControl(overlay)
  },
  methods: {
    addLayers () {
      if (!map.getSource('route')) {
        map.addSource('route', {
          type: 'geojson',
          data: lineString(this.path)
        })
      } else {
        map.getSource('route').setData()
      }
      if (!map.getLayer('route')) {
        map.addLayer({
          id: 'route',
          type: 'line',
          source: 'route'
        })
      }
    },
    start () {
      if (this.i < this.path.length) {
        props.currentTime = this.timestamps[this.i++]
        overlay.setProps({
          layers: [new TripsLayer({ ...props })]
        })
        window.requestAnimationFrame(this.start)
      } else {
        this.i = 0
      }
    }
  }
}
</script>
