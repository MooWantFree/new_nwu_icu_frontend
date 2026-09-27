const siteName = 'NWU.ICU'
export const siteOrigin = 'https://nwu.icu'

export function pageTitle(title = '主页') {
  const base = title.replace(/\s*[-|]\s*NWU\.ICU\s*$/i, '').trim()
  return `${base && base !== siteName ? base : '主页'} - ${siteName}`
}

export function setPageTitle(title: string) {
  document.title = pageTitle(title)
}

export function setPageMetadata(options: { title: string; description?: string; canonical?: string; noindex?: boolean }) {
  setPageTitle(options.title)
  for (const [name, content] of Object.entries({ description: options.description, robots: options.noindex ? 'noindex, follow' : undefined })) {
    const existing = document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`)
    if (!content) { existing?.remove(); continue }
    const tag = existing || document.createElement('meta')
    tag.name = name; tag.content = content
    if (!existing) document.head.appendChild(tag)
  }
  const existing = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!options.canonical) { existing?.remove(); return }
  const tag = existing || document.createElement('link')
  tag.rel = 'canonical'; tag.href = options.canonical
  if (!existing) document.head.appendChild(tag)
}
