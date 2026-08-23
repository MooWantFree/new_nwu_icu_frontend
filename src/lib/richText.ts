import createDOMPurify from 'dompurify'
import { marked } from 'marked'

const purifier = createDOMPurify(window)

export const sanitizeMarkdown = async (markdown: string): Promise<string> => {
  const html = await marked.parse(markdown || '')
  return purifier.sanitize(html, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ['button', 'embed', 'form', 'iframe', 'img', 'input', 'object', 'style', 'template'],
    FORBID_ATTR: ['style'],
  })
}

export const sanitizeUserRichText = (html: string): string => {
  const sanitized = purifier.sanitize(html || '', {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ['embed', 'form', 'iframe', 'input', 'object', 'style', 'template'],
    FORBID_ATTR: ['style'],
  })
  const documentNode = new DOMParser().parseFromString(sanitized, 'text/html')

  for (const image of documentNode.querySelectorAll('img')) {
    try {
      const source = new URL(image.getAttribute('src') || '', window.location.origin)
      if (source.origin !== window.location.origin || !source.pathname.startsWith('/api/download/')) {
        image.replaceWith(documentNode.createTextNode('[外部图片已移除]'))
      } else {
        image.setAttribute('src', `${source.pathname}${source.search}`)
      }
    } catch {
      image.remove()
    }
  }

  for (const link of documentNode.querySelectorAll('a')) {
    try {
      const target = new URL(link.getAttribute('href') || '', window.location.origin)
      if (!['https:', 'http:'].includes(target.protocol)) link.removeAttribute('href')
      link.setAttribute('rel', 'noopener noreferrer')
    } catch {
      link.removeAttribute('href')
    }
  }

  return documentNode.body.innerHTML
}
