import DOMPurify from 'dompurify'
import { marked } from 'marked'

export type ResourceEntry = {
  name: string
  path: string
  type: 'directory' | 'file'
  size: number | null
  modified_at: string
}
export type ResourceContents = ResourceEntry & {
  entries?: ResourceEntry[]
  readme: string
  readme_warning: string
  download_gate_enabled?: boolean
}
export const resourcePageUrl = (path: string) => '/disk' + path.split('/').map(encodeURIComponent).join('/')
export const resourceFileUrl = (path: string, inline = false) =>
  `/api/resources/file/?${new URLSearchParams({ path, ...(inline ? { inline: '1' } : {}) })}`
export const formatResourceSize = (size: number | null) => {
  if (size === null) return '—'
  if (size === 0) return '0 B'
  const unit = Math.min(Math.floor(Math.log(size) / Math.log(1024)), 4)
  return `${Number((size / 1024 ** unit).toFixed(2))} ${['B', 'KB', 'MB', 'GB', 'TB'][unit]}`
}

export async function renderResourceReadme(markdown: string, directory: string) {
  const html = DOMPurify.sanitize(await marked.parse(markdown), {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ['button', 'embed', 'form', 'iframe', 'input', 'object', 'style', 'template'],
    FORBID_ATTR: ['style', 'srcset'],
  })
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const base = new URL(directory.replace(/\/?$/, '/').split('/').map(encodeURIComponent).join('/'), 'https://resource.invalid')
  for (const element of doc.querySelectorAll('a, img')) {
    const attribute = element.tagName === 'IMG' ? 'src' : 'href'
    const value = element.getAttribute(attribute)
    if (!value) continue
    try {
      if (attribute === 'href' && value.startsWith('#')) continue
      const url = new URL(value, base)
      if (url.origin === base.origin) {
        const path = decodeURIComponent(url.pathname)
        if (path.split('/').some(part => part.toLowerCase() === 'readme.md' || part.startsWith('.'))) {
          element.removeAttribute(attribute)
          continue
        }
        element.setAttribute(attribute, attribute === 'src' ? resourceFileUrl(path, true) : resourcePageUrl(path) + url.hash)
      } else if (['http:', 'https:'].includes(url.protocol)) {
        element.setAttribute(attribute, url.href)
        if (attribute === 'href') {
          element.setAttribute('target', '_blank')
          element.setAttribute('rel', 'noopener noreferrer')
        }
      } else if (!(attribute === 'href' && url.protocol === 'mailto:')) {
        element.removeAttribute(attribute)
      }
      if (attribute === 'src') {
        element.setAttribute('loading', 'lazy')
        element.setAttribute('referrerpolicy', 'no-referrer')
      }
    } catch {
      element.removeAttribute(attribute)
    }
  }
  return doc.body.innerHTML
}
