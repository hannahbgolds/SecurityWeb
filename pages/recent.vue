<template>
  <div class="flex h-screen">
    <!-- Sidebar -->
    <Sidebar />

    <!-- Conteúdo -->
    <div class="flex-1 dashboard-content overflow-auto bg-[#121212] text-white">
      <h1 class="text-2xl font-bold mb-4">Envios</h1>

      <div>
        <h2 class="text-xl font-semibold mb-2">Pendente</h2>
        <div class="cards-list grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            v-for="envio in envios.filter(e => e.status !== 'analisado' && e.status !== 'verificado' && e.status !== 'recusado')"
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
      </div>
      <div class="mt-8">
        <h2 class="text-xl font-semibold mb-2">Analisado</h2>
        <div class="cards-list grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            v-for="envio in envios.filter(e => e.status === 'analisado' || e.status === 'verificado' || e.status === 'recusado')"
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
      </div>

      <!-- Card flutuante de detalhes -->
      <transition name="fade">
        <div v-if="cardFlutuanteVisivel" class="card-flutuante-overlay" @click.self="closeCard">
          <div class="card-flutuante bg-[#232a3b] text-white rounded-2xl shadow-2xl p-8 max-w-lg w-full relative border border-blue-200">
            <button class="absolute top-3 right-3 text-gray-400 hover:text-blue-300 text-2xl" @click="closeCard">&times;</button>
            <div class="text-base font-medium text-blue-200 mb-2"><strong>Localização:</strong> <span class="font-normal text-white">{{ selectedEnvio?.endereco || '---' }}</span></div>
            <div class="text-sm text-white space-y-3">
              <p><strong>Placa:</strong> {{ selectedEnvio?.placa || '---' }}</p>
              <p><strong>Modelo:</strong> {{ selectedEnvio?.modelo || '---' }}</p>
              <p><strong>Cor:</strong> {{ selectedEnvio?.cor || '---' }}</p>

              <p><strong>Possíveis infrações:</strong></p>
              <div v-if="selectedEnvio?.law_references?.length" class="flex flex-wrap gap-2">
                <el-button
                  v-for="(ref, idx) in selectedEnvio.law_references"
                  :key="idx"
                  :type="selectedInfracao === ref.ticket ? 'primary' : 'default'"
                  @click="() => selecionarInfracao(ref.ticket)"
                >
                  {{ ref.ticket }}
                </el-button>
                <!-- Botão para 'Não houve infração' -->
                <el-button
                  :type="selectedInfracao === null ? 'danger' : 'default'"
                  @click="() => selecionarInfracao(null)"
                >
                  Não houve infração
                </el-button>
              </div>
              <p v-else>Nenhuma infração encontrada.</p>

              <div class="flex flex-row gap-4 items-start mt-4">
                <div class="flex-1">
                  <p><strong>Vídeo:</strong></p>
                  <div v-if="selectedEnvio?.videoURL" class="video-thumbnail-wrapper">
                    <div class="video-link" @click="dialogVideoVisible = true">
                      <video :src="selectedEnvio.videoURL" class="video-thumbnail" preload="metadata" />
                      <div class="video-overlay">▶</div>
                    </div>
                  </div>
                  <p v-else>Sem vídeo disponível.</p>
                </div>
                <div class="flex-1">
                  <p><strong>Mapa:</strong></p>
                  <client-only>
                    <div v-if="selectedEnvio?.location" :id="'mini-map-' + selectedEnvio.id" class="mini-map"></div>
                  </client-only>
                </div>
              </div>

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
import { ref, onMounted, watch } from 'vue'
import { db } from '@/composables/useFirebase'
import Sidebar from '@/components/Sidebar.vue'
import {
  collection,
  getDocs,
  updateDoc,
  doc as firestoreDoc
} from 'firebase/firestore'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { getAddressFromCoords } from '@/composables/useReverseGeocode'

interface LawReference {
  law_reference: string
  score: number
  ticket: string
}

interface Envio {
  id: string
  status: string
  timestamp: string
  userID: string
  videoURL: string
  modelo: string
  placa: string
  cor: string
  infracao: string
  possivel_infracao: string
  law_references: LawReference[]
  location: [number, number] | { latitude: number; longitude: number }
  endereco: string
  infracao_escolhida?: string | null
}

const envios = ref<Envio[]>([])
const selectedEnvio = ref<Envio | null>(null)
const cardFlutuanteVisivel = ref(false)
const dialogVideoVisible = ref(false)
const selectedInfracao = ref<string | null>(null)

let L: any

async function selecionarInfracao(ticket: string | null) {
  selectedInfracao.value = ticket
  if (!selectedEnvio.value) return
  const envioDocRef = firestoreDoc(db, 'Envios', selectedEnvio.value.id)
  let novoStatus = ''
  if (ticket === null) {
    novoStatus = 'recusado'
  } else {
    novoStatus = 'verificado'
  }
  // Atualiza no Firestore com status e infração escolhida
  await updateDoc(envioDocRef, { 
    status: novoStatus,
    infracao_escolhida: ticket // Salva a infração escolhida
  })
  // Atualiza localmente para refletir na UI
  selectedEnvio.value.status = novoStatus
  selectedEnvio.value.infracao_escolhida = ticket
  // Também atualiza na lista principal
  const idx = envios.value.findIndex(e => e.id === selectedEnvio.value?.id)
  if (idx !== -1) {
    envios.value[idx].status = novoStatus
    envios.value[idx].infracao_escolhida = ticket
  }
}

function openCard(envio: Envio) {
  selectedInfracao.value = null // Limpa seleção ao abrir novo card
  selectedEnvio.value = envio
  cardFlutuanteVisivel.value = true
}
function closeCard() {
  cardFlutuanteVisivel.value = false
  selectedEnvio.value = null
}

onMounted(async () => {
  const snapshot = await getDocs(collection(db, 'Envios'))
  envios.value = await Promise.all(snapshot.docs.map(async doc => {
    const data = doc.data()
    const timestampDate = data.timestamp?.toDate ? data.timestamp.toDate() : new Date()
    const formattedDate = format(timestampDate, "dd 'de' MMMM 'de' yyyy 'às' HH:mm:ss", { locale: ptBR })
    let endereco = '---'
    if (data.location && typeof data.location.latitude === 'number' && typeof data.location.longitude === 'number') {
      endereco = await getAddressFromCoords(data.location.latitude, data.location.longitude)
    }
    return {
      id: doc.id,
      status: data.status,
      timestamp: formattedDate,
      userID: data.userID,
      videoURL: data.videoURL,
      modelo: data.infracao?.modelo || data.infracao?.Modelo || '',
      placa: data.infracao?.placa || data.infracao?.Placa || '',
      cor: data.infracao?.cor || data.infracao?.Cor || '',
      infracao: data.infracao,
      possivel_infracao: data['possível infração'] || data.possivel_infracao,
      law_references: Array.isArray(data.infracao?.law_references)
        ? data.infracao.law_references
        : Object.values(data.infracao?.law_references || {}),
      location: data.location,
      endereco,
      infracao_escolhida: data.infracao_escolhida || null
    }
  }))
})

watch(selectedEnvio, (envio) => {
  if (!envio) return
  // Define o botão selecionado de acordo com o status
  if (envio.status === 'verificado') {
    // Se já foi verificado, seleciona a primeira infração (ou mantenha a última selecionada, se quiser)
    selectedInfracao.value = envio.law_references?.[0]?.ticket || null
  } else if (envio.status === 'recusado') {
    selectedInfracao.value = null
  } else {
    selectedInfracao.value = null
  }
})

watch(selectedEnvio, async (envio) => {
  if (envio && process.client && envio.location) {
    if (!L) {
      const leafletModule = await import('leaflet')
      await import('leaflet/dist/leaflet.css')
      L = leafletModule.default || leafletModule
    }
    setTimeout(() => {
      const mapId = 'mini-map-' + envio.id
      const mapDiv = document.getElementById(mapId)
      // @ts-ignore: _leaflet_id is an internal property
      if (mapDiv && !mapDiv._leaflet_id) {
        const lat = Array.isArray(envio.location) ? envio.location[0] : envio.location.latitude
        const lng = Array.isArray(envio.location) ? envio.location[1] : envio.location.longitude
        const map = L.map(mapId, {
          center: [lat, lng],
          zoom: 15,
          attributionControl: false
        })
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: ''
        }).addTo(map)
        L.marker([lat, lng]).addTo(map)
      }
    }, 100)
  }
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
.mini-map {
  width: 180px;
  height: 120px;
  border-radius: 0.75rem;
  overflow: hidden;
  margin-top: 0.5rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.18);
}
@keyframes popin {
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
</style>
  console.log("law_references", data.law_references);
console.log("law_references", data.law_references);
