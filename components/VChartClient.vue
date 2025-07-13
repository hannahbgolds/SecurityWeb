<template>
  <client-only>
    <v-chart v-bind="$attrs" />
  </client-only>
</template>

<script setup>
import VChart from 'vue-echarts'
</script> 