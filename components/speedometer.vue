<template>
  <GChart :type="type" :data="table" :options="options" :settings="settings" />
</template>

<script>
import { GChart } from 'vue-google-charts/legacy'

export default {
  name: 'SpeedometerComponent',
  components: {
    GChart
  },
  props: {
    speed: {
      default: () => 0,
      type: Number
    }
  },
  data () {
    return {
      type: 'Gauge',
      options: {
        width: 100,
        minorTicks: 5,
        max: 160
      },
      settings: {
        packages: ['gauge']
      }
    }
  },
  computed: {
    table () {
      return [
        ['Label', 'Value'],
        ['Km/h', this.speed]
      ]
    }
  }
}
</script>
