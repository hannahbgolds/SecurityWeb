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
import { onMounted } from 'vue'
import { getDocs, collection } from 'firebase/firestore'
import { db } from '@/composables/useFirebase'

onMounted(async () => {
  if (process.client) {
    const L = (await import('leaflet')).default
    await import('leaflet/dist/leaflet.css')
    const { default: heat } = await import('leaflet.heat')

    const enviosSnap = await getDocs(collection(db, 'Envios'))
    const envios = enviosSnap.docs.map(doc => doc.data())
    const pontos = envios
      .filter(e => ['analisado', 'verificado'].includes(e.status))
      .map(e => {
        const loc = e.location || e.infracao?.location
        if (loc && typeof loc.latitude === 'number' && typeof loc.longitude === 'number') {
          return [loc.latitude, loc.longitude, 1]
        }
        return null
      })
      .filter(Boolean)

    // Só inicializa o mapa se o container existir
    const mapDiv = document.getElementById('heatmap')
    if (mapDiv) {
      const map = L.map('heatmap').setView([-23.56, -46.65], 12)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: ''
      }).addTo(map)
      heat(pontos, { radius: 25, blur: 15, maxZoom: 17 }).addTo(map)
    }
  }
})
</script> 