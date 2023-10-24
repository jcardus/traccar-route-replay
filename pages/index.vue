<template>
  <div style="height: 100%; width: 100%">
    <loading :active="loading" />
    <div id="map" style="height: 100%; width: 100%" />
    <div
      ref="slider"
      class="mapboxgl-ctrl mapboxgl-ctrl-group mapboxgl-ctrl-timeline"
      style="display: flex; width: calc(100vw - 20px); justify-content: center;"
    >
      <div class="mapboxgl-ctrl-timeline__label">
        <b>{{ device && device.name }}</b>
      </div>
      <div class="mapboxgl-ctrl-timeline__control" style="flex-grow: 1">
        <button
          class="mapboxgl-ctrl-icon svg-button"
          style="background-image: url('backward.svg')"
          @click="(i - 1 >= 0) && i--"
        />
        <button
          class="mapboxgl-ctrl-icon svg-button"
          :style="`background-image: url('${playing ? 'pause' : 'play'}.svg')`"
          @click="playing = !playing"
        />
        <button
          class="mapboxgl-ctrl-icon svg-button"
          style="background-image: url('forward.svg')"
          @click="(i + 1 < path.length) && i++"
        />
        <input
          ref="sliderInput"
          v-model="currentTime"
          class="mapboxgl-ctrl-timeline__slider"
          type="range"
          :min="min"
          :max="max"
          :style="`background-image: url('${sliderBackground}');`"
        >
      </div>
      <div class="mapboxgl-ctrl-timeline__label">
        {{ timestamps[i] && new Date(timestamps[i]).toLocaleString() }}
      </div>
      <div class="mapboxgl-ctrl-timeline__label">
        <select id="speeds" v-model="playSpeed" style="font-size: 1rem;">
          <option v-for="option in speeds" :key="option.value" :value="option.value">
            {{ option.text }}
          </option>
        </select>
        <input id="follow" v-model="follow" type="checkbox">
        <label for="follow">{{ $t('Follow vehicle') }}</label>
      </div>
    </div>
    <div ref="speedometer" class="mapboxgl-ctrl">
      <speedometer :speed="route[i] && route[i].speed * 1.852" />
    </div>
    <div ref="styleSwitcher">
      <style-switcher @changed="styleChanged" />
    </div>
    <div ref="mapillary" class="mapboxgl-ctrl" style="width: 256px; height: 192px">
      <span style="position: absolute; z-index: 2; left: 50%; background: white; padding-left: 5px; padding-right: 5px">
        <a style="color: black" target="_blank" :href="`https://www.mapillary.com/app/?pKey=${imgId}`">{{ imgTime }}</a>
      </span>
      <div ref="mapillaryViewer" style="width: 100%; height: 100%" />
    </div>
    <canvas ref="sliderLine" style="position: absolute; left:-100000px" height="40" width="10000" />
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import bbox from '@turf/bbox'
import { lineString, points } from '@turf/helpers'
import { MapboxOverlay } from '@deck.gl/mapbox'
import Loading from 'vue-loading-overlay'
import { ScenegraphLayer } from '@deck.gl/mesh-layers'
import mapboxgl from 'mapbox-gl'
import { Viewer } from 'mapillary-js'
import { closest, green } from '@/utils'
import StyleSwitcher from '@/components/style-switcher.vue'
import { getImage, init } from '@/utils/mapillary'
import Speedometer from '@/components/speedometer.vue'
import { get3dModel } from '@/utils/models3d'
const overlay = new MapboxOverlay({ layers: [] })

mapboxgl.accessToken = process.env.MAPBOX_ACCESS_TOKEN
let map
let viewer
const boundsPadding = 50 // px
const maxAltitude = 400000
const maxLatitudeDistance = 6

export default {
  name: 'IndexPage',
  components: { Speedometer, Loading, StyleSwitcher },
  data () {
    return {
      imgId: 0,
      imgTime: '',
      imgSrc: '',
      imgLoaded: true,
      speeds: [
        { text: '1x', value: 400 },
        { text: '2x', value: 200 },
        { text: '5x', value: 80 },
        { text: '10x', value: 40 }
      ],
      loading: false,
      playing: false,
      i: 0,
      playSpeed: 400,
      follow: false,
      sliderBackground: ''
    }
  },
  computed: {
    ...mapGetters(['devices', 'path', 'timestamps', 'route', 'showTerrain', 'showSigns', 'showBuildings']),
    cameraAltitude () {
      return maxAltitude / this.playSpeed
    },
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
      const model = get3dModel(this.device.category)
      overlay.setProps({
        layers: [new ScenegraphLayer({
          id: model,
          data: [{
            point: this.path[this.i],
            heading: this.route[this.i].course,
            altitude: map.queryTerrainElevation(this.path[this.i])
          }],
          scenegraph: model.scenegraph,
          sizeScale: model.sizeScale,
          getPosition: d => d.point,
          getTranslation: d => [0, 0, d.altitude],
          getOrientation: model.getOrientation,
          _lighting: 'pbr',
          sizeMinPixels: model.sizeMinPixels || 12
        })]
      })
      if (this.follow) {
        const camera = map.getFreeCameraOptions()
        camera.position = mapboxgl.MercatorCoordinate.fromLngLat(
          [this.route[this.i].longitude, this.route[this.i].latitude - (maxLatitudeDistance / this.playSpeed)],
          this.cameraAltitude
        )
        camera.lookAtPoint(this.path[this.i])
        map.setFreeCameraOptions(camera)
      }
      this.checkImage()
    },
    path () {
      this.loading = false
      if (this.path && this.path.length) {
        map.getSource('route').setData(lineString(this.path))
        const bounds = bbox(points(this.path))
        map.fitBounds(bounds, { padding: boundsPadding })
        this.updateSliderBackground()
        init(bounds, this.path, map)
        this.checkImage()
      }
    },
    playing () {
      if (this.playing) {
        if (this.i + 1 === this.path.length) { this.i = 0 }
        this.play()
      }
    },
    showTerrain () {
      if (this.showTerrain) {
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
    },
    showBuildings () {
      if (this.showBuildings) {
        // Insert the layer beneath any symbol layer.
        const layers = map.getStyle().layers
        const labelLayerId = layers.find(
          layer => layer.type === 'symbol' && layer.layout['text-field']
        ).id

        // The 'building' layer in the Mapbox Streets
        // vector tileset contains building height data
        // from OpenStreetMap.
        map.addLayer(
          {
            id: 'add-3d-buildings',
            source: 'composite',
            'source-layer': 'building',
            filter: ['==', 'extrude', 'true'],
            type: 'fill-extrusion',
            minzoom: 15,
            paint: {
              'fill-extrusion-color': '#aaa',

              // Use an 'interpolate' expression to
              // add a smooth transition effect to
              // the buildings as the user zooms in.
              'fill-extrusion-height': [
                'interpolate',
                ['linear'],
                ['zoom'],
                15,
                0,
                15.05,
                ['get', 'height']
              ],
              'fill-extrusion-base': [
                'interpolate',
                ['linear'],
                ['zoom'],
                15,
                0,
                15.05,
                ['get', 'min_height']
              ],
              'fill-extrusion-opacity': 0.6
            }
          },
          labelLayerId)
      } else {
        map.removeLayer('buildings')
      }
    },
    showSigns () {
      if (this.showSigns) {
        map.addSource('signs', {
          type: 'vector',
          tiles: [
            `https://tiles.mapillary.com/maps/vtp/mly_map_feature_traffic_sign/2/{z}/{x}/{y}?access_token=${process.env.MAPILLARY_ACCESS_TOKEN}`
          ]
        })
        map.addLayer({
          id: 'signs',
          type: 'symbol',
          'source-layer': 'traffic_sign',
          source: 'signs',
          layout: {
            'icon-image': ['get', 'value']
          }
        })
      } else {
        if (map.getLayer('signs')) {
          map.removeLayer('signs')
        }
        if (map.getSource('signs')) {
          map.removeSource('signs')
        }
      }
    }
  },
  mounted () {
    new ResizeObserver(this.updateSliderBackground).observe(this.$refs.sliderInput)
    this.loading = true
    map = new mapboxgl.Map({
      container: 'map', // container ID
      style: 'mapbox://styles/mapbox/streets-v12', // style URL
      zoom: localStorage.getItem('zoom'),
      center: localStorage.getItem('center') ? JSON.parse(localStorage.getItem('center')) : [0, 0]
    })
    map.on('moveend', () => {
      localStorage.setItem('center', JSON.stringify(map.getCenter()))
      localStorage.setItem('zoom', map.getZoom())
    })
    map.on('style.load', this.styleLoaded)
    map.on('styleimagemissing', this.styleImageMissing)
    map.addControl({ onAdd: () => this.$refs.slider }, 'top-right')
    map.addControl({ onAdd: () => this.$refs.speedometer }, 'top-right')
    map.addControl(new mapboxgl.NavigationControl())
    map.addControl({ onAdd: () => this.$refs.styleSwitcher })
    map.addControl({ onAdd: () => this.$refs.mapillary }, 'bottom-right')
    map.addControl(overlay)
    viewer = new Viewer({
      accessToken: process.env.MAPILLARY_ACCESS_TOKEN,
      container: this.$refs.mapillaryViewer
    })
  },
  methods: {
    styleImageMissing (e) {
      if (e.id.startsWith('regulatory')) {
        const img = new Image(20, 20)
        img.src = `signs/${e.id}.svg`
        img.onload = () => !map.hasImage(e.id) && map.addImage(e.id, img)
      }
    },
    checkImage () {
      const i = this.i
      const image = getImage(this.path[i], this.route[i].course)
      if (image.id && this.imgId !== image.id && this.imgTime !== 'loading...') {
        this.imgTime = 'loading...'
        this.imgId = image.id
        viewer.moveTo(image.id)
          .then(() => { this.imgTime = new Date(this.route[i].fixTime).toLocaleString() })
          .catch((e) => { this.imgTime = e.message })
        // viewer.setCenter(this.route[this.i].course)
      }
    },
    styleChanged (style) {
      map.setStyle(style.uri)
    },
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
        this.drawLine(context, linePosition, this.$refs.sliderInput.clientWidth, -1)
        this.sliderBackground = canvas.toDataURL()
      }
    },
    drawLine (context, start, end, status) {
      context.beginPath()
      context.strokeStyle = {
        '-1': '#979797',
        0: '#ff0022',
        1: green,
        2: '#F9B218'
      }[status]
      context.lineWidth = 10
      context.moveTo(start, 4)
      context.lineTo(end, 4)
      context.stroke()
    },
    getEndIndex (date) {
      return this.$refs.sliderInput.clientWidth * (new Date(date) - this.min) / (this.max - this.min)
    },
    newColoredLine (p, context, currentLinePosition, currentStatus) {
      const end = this.getEndIndex(p.fixTime)
      this.drawLine(context, currentLinePosition, end, currentStatus)
      return end
    },
    styleLoaded () {
      this.addLayers()
      this.$store.dispatch('getPath')
      process.env.COUNTRY && this.setWorldView(process.env.COUNTRY)
      this.$store.commit('SET_TERRAIN', false)
      this.$store.commit('SET_SIGNS', false)
      this.$store.commit('SET_BUILDINGS', false)
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
        source: 'route',
        paint: {
          'line-color': green,
          'line-width': 8
        },
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        }
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
<style>
.svg-button {
  border: 0 !important;
  margin: 0 !important;
  padding: 0 !important;
  background-repeat: no-repeat !important;
  background-position: center !important;
  pointer-events: auto !important;
  height: 32px !important;
  background-color: red;
}
</style>
