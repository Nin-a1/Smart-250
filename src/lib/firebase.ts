import { initializeApp, FirebaseApp } from 'firebase/app'
import { Firestore, getFirestore } from 'firebase/firestore'

const cfg = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY             as string,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN         as string,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID          as string,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET      as string,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID              as string,
}

export const isFirebaseConfigured = Boolean(cfg.apiKey && cfg.projectId)

let _db: Firestore | null = null

if (isFirebaseConfigured) {
  const app: FirebaseApp = initializeApp(cfg)
  _db = getFirestore(app)
}

export const db = _db as Firestore
