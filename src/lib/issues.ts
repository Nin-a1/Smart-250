import {
  collection, doc, getDoc, getDocs,
  setDoc, updateDoc, deleteDoc, query, orderBy,
} from 'firebase/firestore'
import { ref, uploadString, getDownloadURL } from 'firebase/storage'
import { db, storage, isFirebaseConfigured } from './firebase'
import { Issue } from '../types'

const LOCAL_KEY   = 'ska_issues'
const COLLECTION  = 'issues'

// ── localStorage helpers ───────────────────────────────────────────────────────

function localGet(): Issue[] {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]') } catch { return [] }
}

function localSet(issues: Issue[]): void {
  // When Firebase is active, strip heavy base64 blobs from the local cache
  const slim = isFirebaseConfigured
    ? issues.map(i => ({ ...i, photoBase64: '', resolutionPhotoBase64: '' }))
    : issues
  localStorage.setItem(LOCAL_KEY, JSON.stringify(slim))
}

// ── Firebase Storage helpers ───────────────────────────────────────────────────

async function uploadPhoto(dataUrl: string, path: string): Promise<string> {
  const storageRef = ref(storage, path)
  await uploadString(storageRef, dataUrl, 'data_url')
  return getDownloadURL(storageRef)
}

// ── Public API ─────────────────────────────────────────────────────────────────

export async function saveIssue(issue: Issue): Promise<void> {
  if (isFirebaseConfigured) {
    let photoUrl = issue.photoUrl
    if (!photoUrl && issue.photoBase64) {
      photoUrl = await uploadPhoto(issue.photoBase64, `issues/${issue.id}/before.jpg`)
    }
    const docData: Record<string, unknown> = {
      ...issue,
      photoBase64: '',
      resolutionPhotoBase64: '',
      photoUrl: photoUrl ?? '',
    }
    await setDoc(doc(db, COLLECTION, issue.id), docData)
    issue = { ...issue, photoUrl }
  }

  const all = localGet().filter(i => i.id !== issue.id)
  localSet([issue, ...all])
}

export async function updateIssue(id: string, patch: Partial<Issue>): Promise<Issue | null> {
  if (isFirebaseConfigured && patch.resolutionPhotoBase64) {
    const url = await uploadPhoto(
      patch.resolutionPhotoBase64,
      `issues/${id}/after.jpg`,
    )
    patch = { ...patch, resolutionPhotoUrl: url, resolutionPhotoBase64: '' }
  }

  if (isFirebaseConfigured) {
    const clean: Record<string, unknown> = { ...patch }
    await updateDoc(doc(db, COLLECTION, id), clean)
  }

  const all = localGet()
  const idx = all.findIndex(i => i.id === id)
  if (idx !== -1) {
    all[idx] = { ...all[idx], ...patch }
    localSet(all)
    return all[idx]
  }
  return null
}

export async function getIssues(): Promise<Issue[]> {
  if (isFirebaseConfigured) {
    try {
      const snap = await getDocs(
        query(collection(db, COLLECTION), orderBy('createdAt', 'desc')),
      )
      const issues = snap.docs.map(d => d.data() as Issue)
      localSet(issues)
      return issues
    } catch {
      // fall through to local cache
    }
  }
  return localGet()
}

export async function getIssueById(id: string): Promise<Issue | null> {
  if (isFirebaseConfigured) {
    try {
      const snap = await getDoc(doc(db, COLLECTION, id))
      if (snap.exists()) return snap.data() as Issue
    } catch {
      // fall through
    }
  }
  return localGet().find(i => i.id === id) ?? null
}

export async function getOpenIssues(): Promise<Issue[]> {
  return (await getIssues()).filter(i => i.status !== 'resolved')
}

export async function clearAllIssues(): Promise<void> {
  if (isFirebaseConfigured) {
    const snap = await getDocs(collection(db, COLLECTION))
    await Promise.all(snap.docs.map(d => deleteDoc(d.ref)))
  }
  localStorage.removeItem(LOCAL_KEY)
  localStorage.removeItem('ska_friday_last_sent')
}

export function generateId(): string {
  return `SKA-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`
}
