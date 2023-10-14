<template>
  <div style="height: 100%; width: 100%">
    <loading :active="loading" />
    <div id="map" style="height: 100%; width: 100%" />
    <!--div id="slider" ref="slider" class="maplibregl-ctrl maplibregl-ctrl-group mapboxgl-ctrl-timeline"-->
    <div id="slider" ref="slider" class="mapboxgl-ctrl mapboxgl-ctrl-group mapboxgl-ctrl-timeline">
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
// import maplibregl from 'maplibre-gl'
import mapboxgl from 'mapbox-gl'
import { TripsLayer } from '@deck.gl/geo-layers'
import { mapGetters } from 'vuex'
// const animationSpeed = 1
import bbox from '@turf/bbox'
import { lineString } from '@turf/helpers'
import { MapboxOverlay } from '@deck.gl/mapbox'
import Loading from 'vue-loading-overlay'
import { ArcLayer } from '@deck.gl/layers'

const source = [-122.3998664, 37.7883697]
const target = [-122.400068, 37.7900503]
// const data = 'https://raw.githubusercontent.com/visgl/deck.gl-data/master/examples/trips/trips-v7.json'
const trailLength = 2 * 60 * 60 * 1000
const overlay = new MapboxOverlay({
  layers: []
})

mapboxgl.accessToken = process.env.MAPBOX_ACCESS_TOKEN

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

const props2 = {
  id: 'deckgl-arc',
  data: [{ source, target }],
  getSourcePosition: d => d.source,
  getTargetPosition: d => d.target,
  getSourceColor: [255, 208, 0],
  getTargetColor: [0, 128, 255],
  getWidth: 8
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
    playing () {
      if (this.playing) {
        this.start()
      }
    }
  },
  async mounted () {
    this.loading = true
    map = new mapboxgl.Map({
      container: 'map', // container ID
      // style: `https://api.maptiler.com/maps/basic-v2/style.json?key=${process.env.MAPTILER_KEY}`,
      style: 'mapbox://styles/mapbox/streets-v12', // style URL
      zoom: localStorage.getItem('zoom'),
      center: localStorage.getItem('center') ? JSON.parse(localStorage.getItem('center')) : [0, 0]
    })
    map.addControl(new mapboxgl.NavigationControl())
    map.on('moveend', () => {
      localStorage.setItem('center', JSON.stringify(map.getCenter()))
      localStorage.setItem('zoom', map.getZoom())
    })
    map.addControl({ onAdd: () => this.$refs.slider }, 'top-left')
    await this.$store.dispatch('getPath')
    map.fitBounds(bbox(lineString(this.path)))
    props.data = [{
      path: this.path,
      timestamps: this.timestamps
    }]

    map.addSource('route', {
      type: 'geojson',
      data: lineString(this.path)
    })
    map.addLayer({
      id: 'route',
      type: 'line',
      source: 'route'
    })

    map.addControl(overlay)

    // const firstLabelLayerId = map.getStyle().layers.find(layer => layer.type === 'symbol').id
    // map.addLayer(arcLayer)
    // map.addLayer(arcLayer2)
    this.loading = false
  },
  methods: {
    start () {
      if (this.i < this.path.length) {
        props.currentTime = this.timestamps[this.i++]
        props2.data[0].source = this.path[this.i]
        // props2.data[0].target = this.path[this.i]
        // props2.target = this.path.slice(-1)[0]
        overlay.setProps({
          layers: [new TripsLayer({ ...props }), new ArcLayer({ ...props2 })]
        })
        window.requestAnimationFrame(this.start)
      } else {
        this.i = 0
        alert('done')
      }
    }
  }
}
</script>
