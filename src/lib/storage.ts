import { Issue } from '../types'

const KEY = 'ska_issues'

export const getIssues = (): Issue[] => {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] }
}

export const saveIssue = (issue: Issue): void => {
  const all = getIssues().filter(i => i.id !== issue.id)
  localStorage.setItem(KEY, JSON.stringify([issue, ...all]))
}

export const updateIssue = (id: string, patch: Partial<Issue>): Issue | null => {
  const all = getIssues()
  const idx = all.findIndex(i => i.id === id)
  if (idx === -1) return null
  all[idx] = { ...all[idx], ...patch }
  localStorage.setItem(KEY, JSON.stringify(all))
  return all[idx]
}

export const getIssueById = (id: string): Issue | null =>
  getIssues().find(i => i.id === id) ?? null

export const getOpenIssues = (): Issue[] =>
  getIssues().filter(i => i.status !== 'resolved')
