<template>
  <div style="height: 100%; width: 100%">
    <loading :active="loading" />
    <div id="map" style="height: 100%; width: 100%" />
    <div ref="slider" class="mapboxgl-ctrl mapboxgl-ctrl-group mapboxgl-ctrl-timeline">
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
    <div ref="speed" class="mapboxgl-ctrl mapboxgl-ctrl-group">
      <div style="padding: 5px">
        <input id="1x" v-model="playSpeed" type="radio" name="speed" value="400">
        <label for="1x">1x</label>
        <input id="2x" v-model="playSpeed" type="radio" name="speed" value="200">
        <label for="2x">2x</label>
        <input id="5x" v-model="playSpeed" type="radio" name="speed" value="80">
        <label for="5x">5x</label>
        <input id="follow" v-model="follow" type="checkbox">
        <label for="follow">{{ $t('Follow vehicle') }}</label>
      </div>
    </div>
  </div>
</template>

<script>
import { TripsLayer } from '@deck.gl/geo-layers'
import { mapGetters } from 'vuex'
import bbox from '@turf/bbox'
import { lineString } from '@turf/helpers'
import { MapboxOverlay } from '@deck.gl/mapbox'
import Loading from 'vue-loading-overlay'
import { ScenegraphLayer } from '@deck.gl/mesh-layers'
import mapboxgl from 'mapbox-gl'
// import maplibregl from 'maplibre-gl'
import { MapboxStyleSwitcherControl } from 'mapbox-gl-style-switcher'
import { closest } from '@/utils'
import { fitBounds } from '@/utils/options'

const overlay = new MapboxOverlay({
  layers: []
})

mapboxgl.accessToken = process.env.MAPBOX_ACCESS_TOKEN
const cameraAltitude = 4000
let map

const MODEL_URL = 'https://raw.githubusercontent.com/visgl/deck.gl-data/master/examples/google-3d/truck.gltf'

export default {
  name: 'IndexPage',
  components: { Loading },
  data () {
    return {
      loading: false,
      playing: false,
      i: 0,
      playSpeed: 400
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
      overlay.setProps({
        layers: [
          new TripsLayer({
            id: 'trips',
            data: [{
              path: this.path,
              timestamps: this.timestamps
            }],
            getPath: d => d.path,
            getTimestamps: d => d.timestamps,
            opacity: 0.9,
            widthMinPixels: 4,
            rounded: true,
            joinRounded: true,
            trailLength: this.timestamps.slice(-1)[0] - this.timestamps[0],
            shadowEnabled: true,
            getColor: [253, 128, 93],
            currentTime: this.timestamps[this.i]
          }),
          new ScenegraphLayer({
            id: 'truck',
            data: [{ point: this.path[this.i], heading: this.route[this.i].course }],
            scenegraph: MODEL_URL,
            sizeScale: 100,
            getPosition: d => d.point,
            getTranslation: [0, 0, 1],
            getOrientation: d => [0, 180 - d.heading, 90],
            _lighting: 'pbr',
            sizeMinPixels: 8
          })
        ]
      })
    },
    path () {
      this.loading = false
      this.addLayers()
      map.fitBounds(bbox(lineString(this.path)), fitBounds)
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
    map = new mapboxgl.Map({
      container: 'map', // container ID
      // style: `https://api.maptiler.com/maps/basic-v2/style.json?key=${process.env.MAPTILER_KEY}`,
      style: 'mapbox://styles/mapbox/streets-v12', // style URL
      zoom: localStorage.getItem('zoom'),
      center: localStorage.getItem('center') ? JSON.parse(localStorage.getItem('center')) : [0, 0]
    })
    map.on('moveend', () => {
      localStorage.setItem('center', JSON.stringify(map.getCenter()))
      localStorage.setItem('zoom', map.getZoom())
    })
    map.on('load', this.mapLoaded)
    map.addControl(new mapboxgl.NavigationControl())
    map.addControl(new MapboxStyleSwitcherControl())
    map.addControl({ onAdd: () => this.$refs.slider }, 'top-left')
    map.addControl({ onAdd: () => this.$refs.speed }, 'top-left')
    map.addControl(overlay)
  },
  methods: {
    mapLoaded () {
      this.$store.dispatch('getPath')
      process.env.COUNTRY && this.setWorldView(process.env.COUNTRY)
    },
    setWorldView (worldview) {
      map.setFilter('admin-0-boundary-disputed', [
        'all',
        ['==', ['get', 'disputed'], 'true'],
        ['==', ['get', 'admin_level'], 0],
        ['==', ['get', 'maritime'], 'false'],
        ['match', ['get', 'worldview'], ['all', worldview], true, false]
      ])
      map.setFilter('admin-0-boundary', [
        'all',
        ['==', ['get', 'admin_level'], 0],
        ['==', ['get', 'disputed'], 'false'],
        ['==', ['get', 'maritime'], 'false'],
        ['match', ['get', 'worldview'], ['all', worldview], true, false]
      ])
      map.setFilter('admin-0-boundary-bg', [
        'all',
        ['==', ['get', 'admin_level'], 0],
        ['==', ['get', 'maritime'], 'false'],
        ['match', ['get', 'worldview'], ['all', worldview], true, false]
      ])
      map.setFilter('country-label', [
        'all',
        ['match', ['get', 'worldview'], ['all', worldview], true, false]
      ])
    },
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
        if (this.follow) {
          const camera = map.getFreeCameraOptions()
          // set the position and altitude of the camera
          camera.position = mapboxgl.MercatorCoordinate.fromLngLat(
            [this.route[this.i].longitude, this.route[this.i].latitude - 0.1],
            cameraAltitude
          )

          // tell the camera to look at a point along the route
          camera.lookAtPoint(this.path[this.i])
          map.setFreeCameraOptions(camera)
        }
        setTimeout(window.requestAnimationFrame, this.playSpeed, this.play)
      } else {
        this.playing = false
      }
    }
  }
}
</script>
