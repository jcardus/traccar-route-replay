<template>
  <GChart type="LineChart" :data="table" :options="options" />
</template>

<script>
import { GChart } from 'vue-google-charts/legacy'

export default {
  name: 'SpeedChart',
  components: { GChart },
  data () {
    return {
      options: {
        axisTitlesPosition: 'none',
        hAxis: {
          textPosition: 'none',
          viewWindow: {
            min: 0
          }
        },
        backgroundColor: { fill: 'transparent' },
        legend: { position: 'none' },
        chartArea: { left: 0, top: 0, width: '100%', height: '100%' },
        vAxis: { gridlines: { count: 0 } }
      },
      table: [['Year', 'Sales', 'Expenses', 'Profit'],
        ['2010', 1000, 400, 200],
        ['2011', 1000, 400, 200],
        ['2012', 1000, 400, 200],
        ['2013', 1000, 400, 200],
        ['2015', 1170, 460, 250],
        ['2016', 660, 1120, 300],
        ['2017', 1030, 540, 350]]
    }
  }
}
</script>

<style scoped>

</style>
