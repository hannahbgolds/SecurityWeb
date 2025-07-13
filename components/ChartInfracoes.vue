<script setup>
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  ArcElement,
} from 'chart.js'
import { Bar, Pie } from 'vue-chartjs'
import { ref, onMounted } from 'vue'
import { db } from '@/composables/useFirebase'
import { collection, getDocs } from 'firebase/firestore'

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, ArcElement)

const chartData = ref({
  labels: [],
  datasets: [
    {
      label: 'Ocorrências por Tipo de Infração',
      backgroundColor: '#4ade80',
      data: []
    }
  ]
})

const chartOptions = ref({
  responsive: true,
  plugins: {
    legend: {
      display: false
    },
    title: {
      display: true,
      text: 'Tipos de Infração',
      color: '#fff',
      font: { size: 18 }
    }
  },
  scales: {
    x: {
      ticks: { color: '#fff' }
    },
    y: {
      ticks: { color: '#fff' },
      beginAtZero: true
    }
  }
})

onMounted(async () => {
  const snapshot = await getDocs(collection(db, 'Infracoes'))

  const contagem = {}

  snapshot.forEach((doc) => {
    const descricao = doc.data().descricao
    if (descricao) {
      contagem[descricao] = (contagem[descricao] || 0) + 1
    }
  })

  chartData.value.labels = Object.keys(contagem)
  chartData.value.datasets[0].data = Object.values(contagem)
})
</script>

<template>
  <div class="w-full max-w-3xl mx-auto">
    <Bar :data="chartData" :options="chartOptions" />
  </div>
</template>
