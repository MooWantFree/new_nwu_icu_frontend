import createDOMPurify from 'dompurify'

const purifier = createDOMPurify(window)
const ALLOWED_TAGS = ['p', 'br', 'strong', 'em', 's', 'u']

export const sanitizeGuestbookHtml = (value: string) => purifier.sanitize(value || '', {
  ALLOWED_TAGS,
  ALLOWED_ATTR: [],
})

export const guestbookPlainText = (value: string) => {
  const documentNode = new DOMParser().parseFromString(sanitizeGuestbookHtml(value), 'text/html')
  return documentNode.body.textContent?.trim() || ''
}

export type GuestbookDraft = { content: string; anonymous: boolean; updatedAt: string; submissionId?: string }

export const guestbookTextLength = (value: string) => Array.from(guestbookPlainText(value)).length

export const guestbookPasteContent = (text: string) => text.replace(/\r\n?/g, '\n').split('\n').map(line => ({
  type: 'paragraph',
  content: line ? [{ type: 'text', text: line }] : [],
}))

const keyForDraft = (userId: number | string, targetId: number | null) =>
  `guestbook:draft:v1:${userId}:${targetId ?? 'root'}`

export const loadGuestbookDraft = (userId: number | string, targetId: number | null): GuestbookDraft | null => {
  try {
    const draft = localStorage.getItem(keyForDraft(userId, targetId))
    const value: unknown = draft ? JSON.parse(draft) : null
    if (!value || typeof value !== 'object' || !('content' in value) || typeof value.content !== 'string'
      || !('anonymous' in value) || typeof value.anonymous !== 'boolean'
      || !('updatedAt' in value) || typeof value.updatedAt !== 'string') return null
    return {
      content: value.content, anonymous: value.anonymous, updatedAt: value.updatedAt,
      submissionId: 'submissionId' in value && typeof value.submissionId === 'string'
        && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value.submissionId)
        ? value.submissionId : undefined,
    }
  } catch {
    return null
  }
}

export const saveGuestbookDraft = (userId: number | string, targetId: number | null, draft: GuestbookDraft) => {
  try {
    localStorage.setItem(keyForDraft(userId, targetId), JSON.stringify(draft))
    return true
  } catch { return false }
}

export const clearGuestbookDraft = (userId: number | string, targetId: number | null) => {
  try {
    localStorage.removeItem(keyForDraft(userId, targetId))
    return true
  } catch { return false }
}
