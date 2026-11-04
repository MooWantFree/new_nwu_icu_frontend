import { loadSiteConfig } from './siteConfig'

// Retry in this document: reloading would discard captured email-link tokens.
export async function loadSiteConfigWithRetry(root: Element | null) {
  if (!root) throw new Error('Missing application root')
  const notice = document.createElement('div')
  notice.className = 'm-4 flex items-center gap-3 rounded border border-zinc-300 bg-white p-4 text-zinc-900'
  const message = document.createElement('p')
  message.setAttribute('role', 'alert')
  const retry = document.createElement('button')
  retry.type = 'button'
  retry.className = 'rounded border border-zinc-400 px-3 py-1 focus-visible:outline focus-visible:outline-2 disabled:opacity-50'
  notice.append(message, retry)
  const loading = root.querySelector<HTMLElement>('[data-site-loading]')
  if (loading) {
    const path = window.location.pathname
    loading.dataset.layout = /^\/manage(?:\/|$)/.test(path) ? 'management'
      : /^\/(?:login|user\/(?:login|forget-password|activate|bind-college-email|bind-college-mail))\/?$/.test(path) ? 'auth'
        : /^\/(?:home\/?)?$/.test(path) ? 'home' : 'content'
  }

  while (true) {
    try {
      await loadSiteConfig()
      notice.remove()
      // Vue replaces this only after the initial route is ready.
      if (loading) loading.hidden = false
      return
    } catch {
      if (loading) loading.hidden = true
      message.textContent = '页面加载失败。'
      retry.textContent = '重试'
      retry.disabled = false
      if (!notice.isConnected) root.prepend(notice)
      await new Promise<void>((resolve) => {
        retry.addEventListener('click', () => {
          retry.disabled = true
          retry.textContent = '加载中…'
          message.textContent = ''
          resolve()
        }, { once: true })
      })
    }
  }
}
