<template>
  <div id="map" style="height: 100%; width: 100%" />
</template>

<script>
import mapboxgl from 'mapbox-gl'
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
    map.on('load')
  }
}
</script>
