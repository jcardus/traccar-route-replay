<template>
  <div style="height: 100%; width: 100%">
    <loading :active="loading" />
    <div id="map" style="height: 100%; width: 100%" />
    <div ref="slider" class="maplibregl-ctrl maplibregl-ctrl-group mapboxgl-ctrl-timeline">
      <div class="mapboxgl-ctrl-timeline__control">
        <button
          class="mapboxgl-ctrl-timeline__toggler"
          :class="playing ? 'running' : ''"
          @click="playing = !playing"
        />
        <input
          v-model="currentTime"
          class="mapboxgl-ctrl-timeline__slider"
          type="range"
          :min="timestamps[0]"
          :max="timestamps.slice(-1)[0]"
          style="width: 400px"
        >
      </div>
      <div class="mapboxgl-ctrl-timeline__label">
        {{ timestamps[i] && new Date(timestamps[i]).toLocaleString() }}
      </div>
    </div>
    <div ref="speed" class="maplibregl-ctrl maplibregl-ctrl-group">
      <div style="padding: 5px" class="maplibregl-ctrl-icon">
        <input id="1x" type="radio" name="speed">
        <label for="1x">1x</label>
        <input id="2x" type="radio" name="speed">
        <label for="2x">2x</label>
        <input id="5x" type="radio" name="speed">
        <label for="5x">5x</label>
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
import { ScenegraphLayer } from '@deck.gl/mesh-layers'
import { closest } from '@/utils'
import { fitBounds } from '@/utils/options'

const overlay = new MapboxOverlay({
  layers: []
})

// mapboxgl.accessToken = process.env.MAPBOX_ACCESS_TOKEN

let map
const props = {
  id: 'trips',
  getPath: d => d.path,
  getTimestamps: d => d.timestamps,
  opacity: 0.9,
  widthMinPixels: 4,
  rounded: true,
  joinRounded: true,
  trailLength: 0,
  shadowEnabled: true,
  getColor: [253, 128, 93]
}
const MODEL_URL = 'https://raw.githubusercontent.com/visgl/deck.gl-data/master/examples/google-3d/truck.gltf'; // eslint-disable-line

export default {
  name: 'IndexPage',
  components: { Loading },
  data () {
    return {
      loading: false,
      playing: false,
      i: 0,
      playSpeed: 100
    }
  },
  computed: {
    ...mapGetters(['devices', 'path', 'timestamps', 'route']),
    currentTime: {
      get () { return this.timestamps[this.i] },
      set (time) { this.i = closest(this.timestamps, time) }
    }
  },
  watch: {
    i () {
      props.currentTime = this.timestamps[this.i]
      overlay.setProps({
        layers: [
          new TripsLayer(props),
          new ScenegraphLayer({
            id: 'truck',
            data: [{ point: this.path[this.i], heading: this.route[this.i].course }],
            scenegraph: MODEL_URL,
            sizeScale: 500,
            getPosition: d => d.point,
            getTranslation: [0, 0, 1],
            getOrientation: d => [0, 180 - d.heading, 90],
            _lighting: 'pbr'
          })
        ]
      })
    },
    path () {
      this.loading = false
      this.addLayers()
      map.fitBounds(bbox(lineString(this.path)), fitBounds)
      props.trailLength = this.timestamps.slice(-1)[0] - this.timestamps[0]
      props.data = [{
        path: this.path,
        timestamps: this.timestamps
      }]
    },
    playing () {
      if (this.playing) {
        if (this.i + 1 === this.path.length) { this.i = 0 }
        this.play()
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
    map.addControl({ onAdd: () => this.$refs.speed }, 'top-left')
    map.addControl(overlay)
  },
  methods: {
    addLayers () {
      if (this.path && this.path.length) {
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
      }
    },
    play () {
      if (this.i + 1 < this.path.length && this.playing) {
        this.i++
        setTimeout(window.requestAnimationFrame, this.playSpeed, this.play)
      } else {
        this.playing = false
      }
    }
  }
}
</script>
