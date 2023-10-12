<template>
  <div id="map" style="height: 100%; width: 100%" />
</template>

<script>
import mapboxgl from 'mapbox-gl'
import { TripsLayer } from '@deck.gl/geo-layers'
import { DeckOverlay } from '@deck.gl/mapbox'
export default {
  name: 'IndexPage',
  mounted () {
    mapboxgl.accessToken = process.env.MAPBOX_ACCESS_TOKEN
    const map = new mapboxgl.Map({
      container: 'map', // container ID
      style: 'mapbox://styles/mapbox/streets-v12', // style URL
      center: [-74.5, 40], // starting position [lng, lat]
      zoom: 9 // starting zoom
    })
    const data = {}
    const deckOverlay = new DeckOverlay({
      layers: [
        new TripsLayer({
          id: 'trips',
          data,
          getPath: d => d.path,
          getTimestamps: d => d.timestamps,
          opacity: 0.3,
          widthMinPixels: 2,
          rounded: true,
          trailLength,
          currentTime: time,
          shadowEnabled: false
        })
      ]
    })
    map.addControl(deckOverlay)
    map.addControl(new mapboxgl.NavigationControl())
  }
}
</script>
