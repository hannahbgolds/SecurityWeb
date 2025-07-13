<template>
  <div class="flex h-screen">
    <!-- Sidebar -->
    <Sidebar />

    <!-- Conteúdo -->
    <div class="flex-1 dashboard-content overflow-auto bg-[#121212] text-white">
      <h1 class="text-2xl font-bold mb-4">Envios</h1>

      <!-- Cards de envios -->
      <div class="cards-list grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="envio in envios"
          :key="envio.id"
          class="envio-card cursor-pointer transition group"
          @click="openCard(envio)"
        >
          <div class="flex flex-col gap-3 mb-2">
            <div class="info-linha">
              <span class="timestamp">{{ envio.timestamp }}</span>
              <span class="status">{{ envio.status }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Card flutuante de detalhes -->
      <transition name="fade">
        <div v-if="cardFlutuanteVisivel" class="card-flutuante-overlay" @click.self="closeCard">
          <div class="card-flutuante bg-[#232a3b] text-white rounded-2xl shadow-2xl p-8 max-w-lg w-full relative border border-blue-200">
            <button class="absolute top-3 right-3 text-gray-400 hover:text-blue-300 text-2xl" @click="closeCard">&times;</button>
            <div class="text-lg font-bold mb-2 text-white">Data: {{ selectedEnvio?.timestamp }}</div>
            <div class="text-base font-medium text-blue-200 mb-2"><strong>Localização:</strong> <span class="font-normal text-white">{{ selectedEnvio?.endereco || '---' }}</span></div>
            <div class="text-sm text-white space-y-3">
              <p><strong>Modelo:</strong> {{ selectedEnvio?.veiculo?.modelo || '---' }}</p>
              <p><strong>Placa:</strong> {{ selectedEnvio?.veiculo?.placa || '---' }}</p>
              <p><strong>Cor:</strong> {{ selectedEnvio?.veiculo?.cor || '---' }}</p>

              <!-- Botões de seleção de infração -->
              <div class="mt-4 flex flex-wrap gap-2">
                <el-button
                  v-for="(i, idx) in (selectedEnvio?.infracoes || []).slice(0, 5)"
                  :key="idx"
                  :type="selectedInfracao === i ? 'primary' : 'default'"
                  @click="() => selecionarInfracao(i)"
                >
                  {{ i }}
                </el-button>
                <el-button
                  :type="selectedInfracao === 'Não houve infração.' ? 'primary' : 'default'"
                  @click="() => selecionarInfracao('Não houve infração.')"
                >
                  Não houve infração.
                </el-button>
              </div>

              <p><strong>Vídeo:</strong></p>
              <div v-if="selectedEnvio?.videoURL" class="video-thumbnail-wrapper">
                <div class="video-link" @click="dialogVideoVisible = true">
                  <video :src="selectedEnvio.videoURL" class="video-thumbnail" preload="metadata" />
                  <div class="video-overlay">▶</div>
                </div>
              </div>
              <p v-else>Sem vídeo disponível.</p>

              <!-- Diálogo com o vídeo em tamanho maior -->
              <el-dialog v-model="dialogVideoVisible" width="30%" :before-close="() => (dialogVideoVisible = false)">
                <template #title>Visualização do Vídeo</template>
                <video
                  v-if="selectedEnvio?.videoURL"
                  :src="selectedEnvio.videoURL"
                  controls
                  autoplay
                  style="width: 100%; border-radius: 8px"
                ></video>
              </el-dialog>
            </div>
          </div>
        </div>
      </transition>
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
  where,
  doc as firestoreDoc,
  updateDoc
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
const cardFlutuanteVisivel = ref(false)
const dialogVideoVisible = ref(false)
const selectedInfracao = ref<string>('')

function openCard(envio: Envio) {
  selectedEnvio.value = envio
  cardFlutuanteVisivel.value = true
}
function closeCard() {
  cardFlutuanteVisivel.value = false
  selectedEnvio.value = null
}

async function selecionarInfracao(val: string) {
  selectedInfracao.value = val
  if (selectedEnvio.value) {
    selectedEnvio.value.status = 'analisado'
    // Atualiza também na tabela principal
    const index = envios.value.findIndex(e => e.id === selectedEnvio.value?.id)
    if (index !== -1) {
      envios.value[index].status = 'analisado'
    }
    // Atualiza no Firestore
    const envioDocRef = firestoreDoc(db, 'Envios', selectedEnvio.value.id)
    await updateDoc(envioDocRef, { status: 'analisado' })
  }
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
    const envioRef = firestoreDoc(db, 'Envios', doc.id)
    const infraSnapshot = await getDocs(
      query(collection(db, 'Infracoes'), where('envioRef', '==', envioRef))
    )
    const infracoes = infraSnapshot.docs.map(d => d.data().descricao)

    // 🔍 Veículo
    const veiculoSnapshot = await getDocs(
      query(collection(db, 'Veiculo'), where('envioRef', '==', envioRef))
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
            cor: veiculoData.cor
          }
        : undefined
    } as Envio
  })

  envios.value = await Promise.all(docs)
})
</script>

<style scoped>
.cards-list {
  margin-top: 2rem;
  gap: 2rem;
}
.envio-card {
  background: linear-gradient(135deg, #232a3b 60%, #2e3a5a 100%);
  border-radius: 1rem;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.12);
  padding: 2rem 1.5rem;
  display: flex;
  flex-direction: column;
  min-height: 30px;
  border: 2px solid transparent;
  transition: box-shadow 0.2s, border 0.2s, background 0.2s;
  color: white;
}
.envio-card:hover, .envio-card:focus {
  box-shadow: 0 6px 24px 0 rgba(0,0,0,0.18);
  border: 2px solid #60a5fa;
  background: linear-gradient(135deg, #26304a 60%, #3b82f6 100%);
}
.envio-card:not(:last-child) {
  margin-bottom: 2rem;
}
.info-linha {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 1rem;
}
.timestamp {
  font-weight: 600;
  font-size: 1.125rem;
  color: white;
  transition: color 0.2s;
}
.timestamp:hover {
  color: #93c5fd;
}
.status {
  color: white;
}
.card-flutuante-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.45);
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
}
.card-flutuante {
  animation: popin 0.2s;
  box-shadow: 0 8px 40px 0 rgba(30,64,175,0.18), 0 1.5px 6px 0 rgba(0,0,0,0.10);
  background: #232a3b !important;
  color: white !important;
  border-radius: 1rem;
  padding: 2rem;
}
.video-thumbnail-wrapper {
  position: relative;
  width: 100%;
  max-width: 320px;
  aspect-ratio: 16 / 9;
  margin-bottom: 1em;
}
.video-link {
  position: relative;
  width: 100%;
  height: 100%;
  cursor: pointer;
}
.video-thumbnail {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
  pointer-events: none;
}
.video-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 32px;
  color: white;
  background-color: rgba(0, 0, 0, 0.6);
  padding: 8px 14px;
  border-radius: 50%;
  pointer-events: none;
}
.dashboard-content {
  padding-left: 64px;
}
@keyframes popin {
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
</style>
  