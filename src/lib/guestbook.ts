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

type GuestbookDraft = { content: string; anonymous: boolean; updatedAt: string }

const keyForDraft = (userId: number | string, targetId: number | null) =>
  `guestbook:draft:v1:${userId}:${targetId ?? 'root'}`

export const loadGuestbookDraft = (userId: number | string, targetId: number | null): GuestbookDraft | null => {
  try {
    const draft = localStorage.getItem(keyForDraft(userId, targetId))
    return draft ? JSON.parse(draft) as GuestbookDraft : null
  } catch {
    return null
  }
}

export const saveGuestbookDraft = (userId: number | string, targetId: number | null, draft: GuestbookDraft) => {
  localStorage.setItem(keyForDraft(userId, targetId), JSON.stringify(draft))
}

export const clearGuestbookDraft = (userId: number | string, targetId: number | null) => {
  localStorage.removeItem(keyForDraft(userId, targetId))
}
