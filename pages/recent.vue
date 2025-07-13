<template>
    <div class="flex h-screen">
      <!-- Sidebar -->
      <Sidebar />
  
      <!-- Conteúdo -->
      <div class="flex-1 dashboard-content overflow-auto bg-[#121212] text-white">
        <h1 class="text-2xl font-bold mb-4">Envios</h1>
  
        <el-table
          :data="envios"
          stripe
          style="width: 100%"
          @row-click="handleRowClick"
          highlight-current-row
        >
          <el-table-column prop="timestamp" label="Data" width="240" />
          <el-table-column prop="endereco" label="Localização" />
          <el-table-column prop="status" label="Status" width="120" />
        </el-table>
  
        <!-- Drawer de detalhes -->
        <el-drawer v-model="drawerVisible" direction="rtl" size="30%">
  <template #title>
    <div class="text-lg font-bold text-gray-800">
      Data: {{ selectedEnvio?.timestamp }}
    </div>
  </template>

  <div class="text-sm text-gray-700 space-y-3">
    <p><strong>Modelo:</strong> {{ selectedEnvio?.veiculo?.modelo || '---' }}</p>
    <p><strong>Placa:</strong> {{ selectedEnvio?.veiculo?.placa || '---' }}</p>
    <p><strong>Cor:</strong> {{ selectedEnvio?.veiculo?.cor || '---' }}</p>

    <p><strong>Infrações:</strong></p>
    <ul v-if="selectedEnvio?.infracoes?.length">
      <li v-for="(i, index) in selectedEnvio.infracoes" :key="index">• {{ i }}</li>
    </ul>
    <p v-else>Nenhuma infração encontrada.</p>

    <p><strong>Vídeo:</strong></p>
    <a
      v-if="selectedEnvio?.videoURL"
      :href="selectedEnvio.videoURL"
      target="_blank"
      class="text-blue-500 underline"
    >
      Ver vídeo
    </a>
    <p v-else>Sem vídeo disponível.</p>
  </div>
</el-drawer>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import { db } from '@/composables/useFirebase'
  import Sidebar from '@/components/Sidebar.vue'
  import { getAddressFromCoords } from '@/composables/useReverseGeocode'
  import {
    collection,
    getDocs,
    query,
    where
  } from 'firebase/firestore'
  import { format } from 'date-fns'
  import { ptBR } from 'date-fns/locale'
  
  interface Envio {
    id: string
    status: string
    timestamp: string
    userID: string
    videoURL: string
    location: {
      latitude: number
      longitude: number
    }
    endereco: string
    infracoes: string[]
    veiculo?: {
      modelo: string
      placa: string
      cor: string
    }
  }
  
  const envios = ref<Envio[]>([])
  const selectedEnvio = ref<Envio | null>(null)
  const drawerVisible = ref(false)
  
  function handleRowClick(row: Envio) {
    selectedEnvio.value = row
    drawerVisible.value = true
  }
  
  onMounted(async () => {
    const snapshot = await getDocs(collection(db, 'Envios'))
  
    const docs = snapshot.docs.map(async (doc) => {
      const data = doc.data()
      const endereco = await getAddressFromCoords(
        data.location.latitude,
        data.location.longitude
      )
  
      const timestampDate = data.timestamp.toDate()
      const formattedDate = format(timestampDate, "dd 'de' MMMM 'de' yyyy 'às' HH:mm:ss", {
        locale: ptBR,
      })
  
      // 🔍 Infrações
      const infraSnapshot = await getDocs(
        query(collection(db, 'Infracoes'), where('envioRef', '==', `/Envios/${doc.id}`))
      )
      const infracoes = infraSnapshot.docs.map(d => d.data().descricao)
  
      // 🔍 Veículo
      const veiculoSnapshot = await getDocs(
        query(collection(db, 'Veiculo'), where('envioRef', '==', `/Envios/${doc.id}`))
      )
      const veiculoData = veiculoSnapshot.docs[0]?.data()
  
      return {
        id: doc.id,
        ...data,
        endereco,
        timestamp: formattedDate,
        infracoes,
        veiculo: veiculoData
          ? {
              modelo: veiculoData.modelo,
              placa: veiculoData.placa,
              cor: veiculoData.Cor
            }
          : undefined
      } as Envio
    })
  
    envios.value = await Promise.all(docs)
  })
  </script>
  
  <style scoped>
.dashboard-content {
  padding-left: 64px;    
}
</style>