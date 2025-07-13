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
import { CanvasRenderer } from 'echarts/renderers'
import * as echarts from 'echarts'
import VChart from 'vue-echarts'

// Registre o renderer
echarts.use(CanvasRenderer)

const optionInfracoesTempo = ref({})

async function carregarDados() {
  // Buscar todas as infrações
  const infracoesSnap = await getDocs(collection(db, 'Infracoes'))
  const infracoes = infracoesSnap.docs.map(doc => doc.data())

  // Agrupar por data (por dia)
  const porDia: Record<string, number> = {}
  infracoes.forEach(i => {
    const data = String(i.dataAnalise || i.data || '')
    const dia = data.split(' ')[0]
    porDia[dia] = (porDia[dia] || 0) + 1
  })
  const dias = Object.keys(porDia).sort()
  optionInfracoesTempo.value = {
    tooltip: {},
    xAxis: { type: 'category', data: dias },
    yAxis: { type: 'value' },
    series: [{ type: 'line', data: dias.map(d => porDia[d]), name: 'Infrações' }]
  }
}

onMounted(() => {
  carregarDados()
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

  