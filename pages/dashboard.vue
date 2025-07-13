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

        <!-- Gráfico de pizza - Distribuição de tipos de infração -->
        <div class="card-dashboard">
          <h2 class="card-title">Distribuição de tipos de infração</h2>
          <client-only>
            <VChartClient :option="optionTiposInfracao" autoresize style="height: 320px" />
          </client-only>
        </div>

        <!-- Heatmap de localizações -->
        <div class="card-dashboard">
          <h2 class="card-title">Heatmap de infrações</h2>
          <div id="heatmap" style="height: 320px; width: 100%; border-radius: 8px;"></div>
        </div>
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

// @ts-ignore: leaflet.heat não tem tipos TypeScript

// REGISTRE O RENDERER E COMPONENTES AQUI:
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { TooltipComponent, GridComponent, TitleComponent, LegendComponent } from 'echarts/components'
import { PieChart } from 'echarts/charts'
use([CanvasRenderer, TooltipComponent, GridComponent, TitleComponent, LegendComponent, PieChart])

const optionInfracoesTempo = ref({})
const optionTiposInfracao = ref({})

interface EnvioData {
  status: string
  timestamp: any
  date?: any
  infracao?: any
  infracao_escolhida?: string | null
  location?: any
}

onMounted(async () => {
  const enviosSnap = await getDocs(collection(db, 'Envios'))
  const envios: EnvioData[] = enviosSnap.docs.map(doc => {
    const data = doc.data()
    return {
      status: data.status || '',
      timestamp: data.timestamp,
      date: data.date,
      infracao: data.infracao,
      infracao_escolhida: data.infracao_escolhida || null,
      location: data.location
    }
  })

  // Processamento para gráfico de linha (infrações ao longo do tempo)
  const porDia: Record<string, number> = {}
  envios
    .filter(e => ['analisado', 'verificado'].includes(e.status))
    .forEach(e => {
      let data: Date
      if (e.timestamp?.toDate) {
        data = e.timestamp.toDate()
      } else if (typeof e.date === 'string') {
        data = new Date(e.date)
      } else if (e.date?.toDate) {
        data = e.date.toDate()
      } else {
        data = new Date()
      }
      const dia = data.toISOString().split('T')[0]
      console.log('contando envio:', e, 'law_references:', e.infracao?.law_references)
      porDia[dia] = (porDia[dia] || 0) + 1
    })
  const dias = Object.keys(porDia).sort()
  optionInfracoesTempo.value = {
    tooltip: {},
    xAxis: { type: 'category', data: dias },
    yAxis: { type: 'value', min: 0, max: 2 }, // <-- ajuste aqui
    series: [{
      type: 'line',
      data: dias.map(d => porDia[d]),
      name: 'Infrações',
      showSymbol: true,
      symbol: 'circle',
      symbolSize: 24,
      itemStyle: { color: '#2563eb' },
      lineStyle: { color: '#2563eb' },
      emphasis: { focus: 'series' },
      markPoint: {
        data: [
          { type: 'max', name: 'Máximo' },
          { type: 'min', name: 'Mínimo' }
        ]
      }
    }]
  }

  // Processamento para gráfico de pizza (distribuição de tipos de infração)
  const tiposInfracao: Record<string, number> = {}
  envios
    .filter(e => e.status === 'verificado') // Apenas registros verificados
    .forEach(e => {
      // Usa a infração escolhida se disponível, senão usa a primeira das possíveis
      if (e.infracao_escolhida) {
        // Se há uma infração escolhida, conta ela
        tiposInfracao[e.infracao_escolhida] = (tiposInfracao[e.infracao_escolhida] || 0) + 1
      } else if (e.infracao?.law_references) {
        // Fallback: se não há infração escolhida, usa a primeira das possíveis
        const refs = Array.isArray(e.infracao.law_references) 
          ? e.infracao.law_references 
          : Object.values(e.infracao.law_references)
        
        if (refs.length > 0) {
          const ticket = refs[0].ticket || refs[0].law_reference || 'Desconhecido'
          tiposInfracao[ticket] = (tiposInfracao[ticket] || 0) + 1
        }
      }
    })

  const dadosPizza = Object.entries(tiposInfracao).map(([ticket, count]) => ({
    name: ticket,
    value: count
  }))

  optionTiposInfracao.value = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      textStyle: { color: '#333' }
    },
    series: [{
      name: 'Tipos de Infração',
      type: 'pie',
      radius: '50%',
      data: dadosPizza,
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      }
    }]
  }

  // Inicialização do heatmap
  if (process.client) {
    const L = (await import('leaflet')).default
    await import('leaflet/dist/leaflet.css')
    // @ts-ignore: leaflet.heat não tem tipos TypeScript
    const { default: heat } = await import('leaflet.heat')

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

  console.log('envios verificados:', envios.filter(e => e.status === 'verificado'))
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

  