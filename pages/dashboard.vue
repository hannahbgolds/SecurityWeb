<template>
  <LayoutWrapper>
    <div class="page-container">
      <h1 class="text-2xl font-bold mb-6">Dashboard</h1>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <!-- Gráfico de infrações ao longo do tempo -->
        <div class="card-dashboard md:col-span-2">
          <h2 class="card-title">Infrações ao longo do tempo</h2>
          <client-only>
            <VChartClient :option="optionInfracoesTempo" autoresize style="height: 320px" />
          </client-only>
        </div>
        <!-- Outros gráficos existentes aqui -->
      </div>
    </div>
  </LayoutWrapper>
</template>

<script setup lang="ts">
import LayoutWrapper from '~/components/LayoutWrapper.vue'
import VChartClient from '~/components/VChartClient.vue'
import { ref, onMounted } from 'vue'
import { db } from '@/composables/useFirebase'
import { collection, getDocs } from 'firebase/firestore'

// REGISTRE O RENDERER E COMPONENTES AQUI:
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { TooltipComponent, GridComponent, TitleComponent, LegendComponent } from 'echarts/components'
use([CanvasRenderer, TooltipComponent, GridComponent, TitleComponent, LegendComponent])

const optionInfracoesTempo = ref({})

onMounted(async () => {
  const enviosSnap = await getDocs(collection(db, 'Envios'))
  const envios = enviosSnap.docs.map(doc => doc.data())

  const porDia: Record<string, number> = {}
  envios.forEach(e => {
    let data: Date
    if (e.timestamp?.toDate) {
      data = e.timestamp.toDate()
    } else if (e.date) {
      data = new Date(e.date)
    } else {
      data = new Date()
    }
    const dia = data.toISOString().split('T')[0]
    if (e.infracao?.law_references && e.infracao.law_references.length > 0) {
      porDia[dia] = (porDia[dia] || 0) + 1
    }
  })
  const dias = Object.keys(porDia).sort()
  optionInfracoesTempo.value = {
    tooltip: {},
    xAxis: { type: 'category', data: dias },
    yAxis: { type: 'value' },
    series: [{ type: 'line', data: dias.map(d => porDia[d]), name: 'Infrações' }]
  }
})
</script>

<style scoped>
.page-container {
  padding-left: 240px;
  padding-right: 2rem;
  padding-top: 1.5rem;
}
.card-dashboard {
  background: #fff;
  border-radius: 1rem;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
}
.card-title {
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
}
</style>

  