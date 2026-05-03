import {
  collection, doc, getDoc, getDocs,
  setDoc, updateDoc, deleteDoc, query, orderBy,
} from 'firebase/firestore'
import { db, isFirebaseConfigured } from './firebase'
import { uploadImage } from './imagebb'
import { Issue } from '../types'

const LOCAL_KEY  = 'ska_issues'
const COLLECTION = 'issues'

function localGet(): Issue[] {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]') } catch { return [] }
}

function localSet(issues: Issue[]): void {
  // Strip heavy base64 blobs from local cache only when we have remote URLs
  const slim = isFirebaseConfigured
    ? issues.map(i => ({
        ...i,
        photoBase64: i.photoUrl ? '' : i.photoBase64,
        resolutionPhotoBase64: i.resolutionPhotoUrl ? '' : i.resolutionPhotoBase64,
      }))
    : issues
  localStorage.setItem(LOCAL_KEY, JSON.stringify(slim))
}

async function tryUploadImage(dataUrl: string): Promise<string | null> {
  try {
    return await uploadImage(dataUrl)
  } catch (err) {
    console.warn('[imagebb] upload failed, embedding base64 in Firestore:', err)
    return null
  }
}

export async function saveIssue(issue: Issue): Promise<void> {
  if (isFirebaseConfigured) {
    let photoUrl = issue.photoUrl
    let photoBase64Fallback = ''

    if (!photoUrl && issue.photoBase64) {
      photoUrl = await tryUploadImage(issue.photoBase64) ?? undefined
      if (!photoUrl) photoBase64Fallback = issue.photoBase64
    }

    const docData: Record<string, unknown> = {
      ...issue,
      photoBase64: photoBase64Fallback,
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
    const url = await tryUploadImage(patch.resolutionPhotoBase64)
    if (url) {
      patch = { ...patch, resolutionPhotoUrl: url, resolutionPhotoBase64: '' }
    }
    // If upload failed, base64 stays embedded in Firestore
  }

  if (isFirebaseConfigured) {
    await updateDoc(doc(db, COLLECTION, id), patch as Record<string, unknown>)
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
