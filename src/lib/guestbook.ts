import createDOMPurify from 'dompurify'

import { hasUnsafeUrlCharacters } from '@/lib/security'

const purifier = createDOMPurify(window)
const ALLOWED_TAGS = ['p', 'br', 'strong', 'em', 's', 'u']
const ANNOUNCEMENT_IMAGE_PATH = /^\/api\/download\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/$/i
export const ANNOUNCEMENT_IMAGE_SIZES = ['25', '50', '75', '100'] as const
export type AnnouncementImageSize = typeof ANNOUNCEMENT_IMAGE_SIZES[number]

const isAnnouncementImageSize = (value: string | null): value is AnnouncementImageSize => (
  value !== null && ANNOUNCEMENT_IMAGE_SIZES.some(size => size === value)
)

const unwrap = (element: Element) => element.replaceWith(...Array.from(element.childNodes))

export const sanitizeGuestbookHtml = (value: string) => purifier.sanitize(value || '', {
  ALLOWED_TAGS,
  ALLOWED_ATTR: [],
})

export const sanitizeAnnouncementHtml = (value: string) => {
  const sanitized = purifier.sanitize(value || '', {
    ALLOWED_TAGS: [...ALLOWED_TAGS, 'a', 'img'],
    ALLOWED_ATTR: ['src', 'alt', 'href', 'data-size'],
  })
  const documentNode = new DOMParser().parseFromString(sanitized, 'text/html')

  for (const image of documentNode.querySelectorAll('img')) {
    try {
      const source = new URL(image.getAttribute('src') || '', window.location.origin)
      if (source.origin !== window.location.origin || !ANNOUNCEMENT_IMAGE_PATH.test(source.pathname)) {
        image.remove()
        continue
      }
      image.setAttribute('src', source.pathname)
      const size = image.getAttribute('data-size')
      if (!isAnnouncementImageSize(size)) image.removeAttribute('data-size')
    } catch {
      image.remove()
    }
  }

  for (const link of documentNode.querySelectorAll('a')) {
    try {
      const hrefAttribute = link.getAttribute('href')
      const rawHref = hrefAttribute?.trim()
      if (!rawHref || rawHref.length > 2048 || hasUnsafeUrlCharacters(rawHref)) {
        unwrap(link)
        continue
      }
      const isRootRelative = rawHref.startsWith('/') && !rawHref.startsWith('//')
      const isExplicitHttp = /^https?:\/\//i.test(rawHref)
      if (!isRootRelative && !isExplicitHttp) {
        unwrap(link)
        continue
      }
      const target = new URL(rawHref, window.location.origin)
      if (!['https:', 'http:'].includes(target.protocol)) {
        unwrap(link)
        continue
      }
      if (target.origin === window.location.origin) {
        const normalizedHref = `${target.pathname}${target.search}${target.hash}`
        if (normalizedHref.length > 2048) {
          unwrap(link)
          continue
        }
        link.setAttribute('href', normalizedHref)
        link.removeAttribute('target')
        link.removeAttribute('rel')
      } else {
        const normalizedHref = target.toString()
        if (normalizedHref.length > 2048) {
          unwrap(link)
          continue
        }
        link.setAttribute('href', normalizedHref)
        link.setAttribute('target', '_blank')
        link.setAttribute('rel', 'noopener noreferrer')
      }
    } catch {
      unwrap(link)
    }
  }

  return documentNode.body.innerHTML
}

export const guestbookPlainText = (value: string) => {
  const documentNode = new DOMParser().parseFromString(sanitizeGuestbookHtml(value), 'text/html')
  return documentNode.body.textContent?.trim() || ''
}

export type GuestbookDraft = { title?: string; content: string; anonymous: boolean; updatedAt: string; submissionId?: string }

export const guestbookTextLength = (value: string) => Array.from(guestbookPlainText(value)).length

export const guestbookPasteContent = (text: string) => text.replace(/\r\n?/g, '\n').split('\n').map(line => ({
  type: 'paragraph',
  content: line ? [{ type: 'text', text: line }] : [],
}))

const keyForDraft = (userId: number | string, targetId: number | null, board = 'guestbook') =>
  `guestbook:draft:v1:${board}:${userId}:${targetId ?? 'root'}`
const legacyKeyForDraft = (userId: number | string, targetId: number | null) =>
  `guestbook:draft:v1:${userId}:${targetId ?? 'root'}`

export const loadGuestbookDraft = (userId: number | string, targetId: number | null, board = 'guestbook'): GuestbookDraft | null => {
  try {
    const draft = localStorage.getItem(keyForDraft(userId, targetId, board))
      ?? (board === 'guestbook' ? localStorage.getItem(legacyKeyForDraft(userId, targetId)) : null)
    const value: unknown = draft ? JSON.parse(draft) : null
    if (!value || typeof value !== 'object' || !('content' in value) || typeof value.content !== 'string'
      || !('anonymous' in value) || typeof value.anonymous !== 'boolean'
      || !('updatedAt' in value) || typeof value.updatedAt !== 'string') return null
    return {
      title: 'title' in value && typeof value.title === 'string' ? value.title : '',
      content: value.content, anonymous: value.anonymous, updatedAt: value.updatedAt,
      submissionId: 'submissionId' in value && typeof value.submissionId === 'string'
        && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value.submissionId)
        ? value.submissionId : undefined,
    }
  } catch {
    return null
  }
}

export const saveGuestbookDraft = (userId: number | string, targetId: number | null, draft: GuestbookDraft, board = 'guestbook') => {
  try {
    localStorage.setItem(keyForDraft(userId, targetId, board), JSON.stringify(draft))
    return true
  } catch { return false }
}

export const clearGuestbookDraft = (userId: number | string, targetId: number | null, board = 'guestbook') => {
  try {
    localStorage.removeItem(keyForDraft(userId, targetId, board))
    if (board === 'guestbook') localStorage.removeItem(legacyKeyForDraft(userId, targetId))
    return true
  } catch { return false }
}
