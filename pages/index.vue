<template>
  <div style="height: 100%; width: 100%">
    <loading :active="loading" />
    <div id="map" style="height: 100%; width: 100%" />
    <div ref="slider" class="mapboxgl-ctrl mapboxgl-ctrl-group mapboxgl-ctrl-timeline">
      <div class="mapboxgl-ctrl-timeline__label">
        <b>{{ device && device.name }}</b>
      </div>
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
          :min="min"
          :max="max"
          :style="`background-image: url('${sliderBackground}'); width: ${sliderWith}px;`"
        >
      </div>
      <div class="mapboxgl-ctrl-timeline__label">
        {{ timestamps[i] && new Date(timestamps[i]).toLocaleString() }}
      </div>
    </div>
    <div ref="speed" class="mapboxgl-ctrl mapboxgl-ctrl-group">
      <div style="padding: 5px" class="mapboxgl-ctrl-timeline__label">
        <input id="1x" v-model="playSpeed" type="radio" name="speed" value="400">
        <label for="1x">1x</label>
        <input id="2x" v-model="playSpeed" type="radio" name="speed" value="200">
        <label for="2x">2x</label>
        <input id="5x" v-model="playSpeed" type="radio" name="speed" value="80">
        <label for="5x">5x</label>
        <input id="follow" v-model="follow" type="checkbox">
        <label for="follow">{{ $t('Follow vehicle') }}</label>
        <input id="terrain" v-model="terrain" type="checkbox">
        <label for="terrain">{{ $t('Terrain') }}</label>
      </div>
    </div>
    <canvas ref="sliderLine" height="40" />
  </div>
</template>

<script>
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

const overlay = new MapboxOverlay({ layers: [] })

mapboxgl.accessToken = process.env.MAPBOX_ACCESS_TOKEN
const cameraAltitude = 2000
let map

const MODEL_URL = 'https://raw.githubusercontent.com/visgl/deck.gl-data/master/examples/google-3d/truck.gltf'

export default {
  name: 'IndexPage',
  components: { Loading },
  data () {
    return {
      sliderWith: 400,
      loading: false,
      playing: false,
      i: 0,
      playSpeed: 400,
      follow: false,
      terrain: false,
      sliderBackground: ''
    }
  },
  computed: {
    ...mapGetters(['devices', 'path', 'timestamps', 'route']),
    max () {
      return this.timestamps.slice(-1)[0]
    },
    min () {
      return this.timestamps[0]
    },
    device () {
      return this.devices.find(d => d.id === parseInt(this.$route.query.deviceId)) || this.devices[0]
    },
    currentTime: {
      get () { return this.timestamps[this.i] },
      set (time) { this.i = closest(this.timestamps, time) }
    }
  },
  watch: {
    i () {
      if (this.i > 1 && map.getSource('route')) {
        map.getSource('route').setData(lineString(this.path.slice(0, this.i)))
      }
      overlay.setProps({
        layers: [
          /* new TripsLayer({
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
          }), */
          new ScenegraphLayer({
            id: 'truck',
            data: [{
              point: this.path[this.i],
              heading: this.route[this.i].course,
              altitude: map.queryTerrainElevation(this.path[this.i])
            }],
            scenegraph: MODEL_URL,
            sizeScale: 10,
            getPosition: d => d.point,
            getTranslation: d => [0, 0, d.altitude],
            getOrientation: d => [0, 180 - d.heading, 90],
            _lighting: 'pbr',
            sizeMinPixels: 8
          })
        ]
      })
      if (this.follow) {
        const camera = map.getFreeCameraOptions()
        // set the position and altitude of the camera
        camera.position = mapboxgl.MercatorCoordinate.fromLngLat(
          [this.route[this.i].longitude, this.route[this.i].latitude - 0.05],
          cameraAltitude
        )
        // tell the camera to look at a point along the route
        camera.lookAtPoint(this.path[this.i])
        map.setFreeCameraOptions(camera)
      }
    },
    path () {
      this.loading = false
      if (this.path && this.path.length) {
        map.getSource('route').setData(lineString(this.path))
        map.fitBounds(bbox(lineString(this.path)), fitBounds)
        this.updateSliderBackground()
      }
    },
    playing () {
      if (this.playing) {
        if (this.i + 1 === this.path.length) { this.i = 0 }
        this.play()
      }
    },
    terrain () {
      if (this.terrain) {
        map.addSource('mapbox-dem', {
          type: 'raster-dem',
          url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
          tileSize: 512,
          maxzoom: 14
        })
        map.setTerrain({
          source: 'mapbox-dem',
          exaggeration: 1
        })
      } else {
        try {
          map.setTerrain()
          map.removeSource('mapbox-dem')
        } catch (e) {
          // eslint-disable-next-line no-console
          console.error(e)
        }
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
    map.addControl({ onAdd: () => this.$refs.speed }, 'top-right')
    map.addControl(new mapboxgl.NavigationControl())
    map.addControl(new MapboxStyleSwitcherControl())
    map.addControl({ onAdd: () => this.$refs.slider }, 'top-left')
    map.addControl(overlay)
  },
  methods: {
    updateSliderBackground () {
      const canvas = this.$refs.sliderLine
      if (canvas !== undefined && this.route) {
        const context = canvas.getContext('2d')
        let status = 0
        let linePosition = 0
        this.route.forEach((p) => {
          if (p.attributes.ignition && status !== 1 && p.speed) {
            // to DRIVING
            linePosition = this.newColoredLine(p, context, linePosition, status)
            status = 1
          }
          if (p.attributes.ignition && status !== 2 && !p.speed) {
            // to IDLE
            linePosition = this.newColoredLine(p, context, linePosition, status)
            status = 2
          }
          if (!p.attributes.ignition && status !== 0) {
            // to OFF
            linePosition = this.newColoredLine(p, context, linePosition, status)
            status = 0
          }
        })
        this.sliderBackground = canvas.toDataURL()
      }
    },
    drawLine (context, start, end, status) {
      context.beginPath()
      context.strokeStyle = {
        '-1': '#979797',
        0: '#ff0022',
        1: '#3D993D',
        2: '#F9B218'
      }[status]
      context.lineWidth = 10
      context.moveTo(start, 4)
      context.lineTo(end, 4)
      context.stroke()
    },
    getEndIndex (date) {
      return this.sliderWith * (new Date(date) - this.min) / (this.max - this.min)
    },
    newColoredLine (p, context, currentLinePosition, currentStatus) {
      const end = this.getEndIndex(p.fixTime)
      this.drawLine(context, currentLinePosition, end, currentStatus)
      return end
    },
    mapLoaded () {
      this.addLayers()
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
      map.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: []
          }
        }
      })
      map.addLayer({
        id: 'route',
        type: 'line',
        source: 'route'
      })
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
