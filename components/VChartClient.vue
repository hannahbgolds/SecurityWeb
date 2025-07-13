<template>
  <client-only>
    <VChart v-bind="$attrs" />
  </client-only>
</template>

<script setup>
import { defineProps } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart, LineChart } from 'echarts/charts'
import { TooltipComponent, GridComponent, TitleComponent, LegendComponent } from 'echarts/components'
use([CanvasRenderer, BarChart, LineChart, TooltipComponent, GridComponent, TitleComponent, LegendComponent])
</script> 