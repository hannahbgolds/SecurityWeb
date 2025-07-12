// composables/useFirebase.ts
import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyB0KCsv9r9sqhCVdG0f1sapx5ug2BoQTTw",
  authDomain: "hackatonadapta.firebaseapp.com",
  projectId: "hackatonadapta",
  storageBucket: "hackatonadapta.firebasestorage.app",
  messagingSenderId: "684792914883",
  appId: "1:684792914883:web:0f2ba8237ae3187faed376",
  measurementId: "G-ZTSQ97EPM5" 
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

export { db }

