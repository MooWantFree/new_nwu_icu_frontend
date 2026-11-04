import { afterEach, describe, expect, it, vi } from 'vitest'
import { captureActionTokenFromUrl, clearActionToken, getActionToken } from './actionTokens'
import { siteConfig } from './siteConfig'
import { loadSiteConfigWithRetry } from './siteStartup'
import indexDocument from '../../index.html?raw'

function mountStartupShell() {
  const documentTemplate = new DOMParser().parseFromString(indexDocument, 'text/html')
  document.body.innerHTML = documentTemplate.querySelector('#app')!.outerHTML
  return document.querySelector('#app')!
}

afterEach(() => {
  vi.unstubAllGlobals()
  document.body.replaceChildren()
  window.history.replaceState({}, '', '/')
  clearActionToken('password-reset')
  clearActionToken('account-activation')
  clearActionToken('college-email-bind')
})

describe('site startup recovery', () => {
  it('keeps the page skeleton until the initial route can replace it', async () => {
    const root = mountStartupShell()
    let finish!: (response: unknown) => void
    vi.stubGlobal('fetch', vi.fn(() => new Promise(resolve => { finish = resolve })))
    const ready = loadSiteConfigWithRetry(root)
    expect(root.querySelector('[role="status"]')?.textContent).toContain('页面加载中')
    expect(root.querySelector('.startup-nav')).not.toBeNull()
    expect(root.querySelector('.startup-card')).not.toBeNull()
    expect(root.querySelector('button')).toBeNull()
    finish({ ok: true, json: async () => ({ ...siteConfig }) })
    await ready
    expect(root.querySelector<HTMLElement>('[data-site-loading]')?.hidden).toBe(false)
  })

  it.each([
    ['/', 'home'], ['/home', 'home'], ['/review/course', 'content'],
    ['/user/forget-password', 'auth'], ['/login', 'auth'], ['/manage/files', 'management'],
  ])('uses the matching shell for %s', async (path, layout) => {
    window.history.replaceState({}, '', path)
    const root = mountStartupShell()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ...siteConfig }) }))
    await loadSiteConfigWithRetry(root)
    expect(root.querySelector<HTMLElement>('[data-site-loading]')?.dataset.layout).toBe(layout)
  })

  it('hides the skeleton on failure and restores it after an in-page retry', async () => {
    const root = mountStartupShell()
    vi.stubGlobal('fetch', vi.fn().mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce({ ok: true, json: async () => ({ ...siteConfig }) }))
    const ready = loadSiteConfigWithRetry(root)
    const shell = root.querySelector<HTMLElement>('[data-site-loading]')!
    await vi.waitFor(() => expect(shell.hidden).toBe(true))
    root.querySelector('button')!.click()
    await ready
    expect(shell.hidden).toBe(false)
    expect(root.querySelector('[role="alert"]')).toBeNull()
  })

  it.each([
    ['/user/forget-password', 'password-reset'],
    ['/user/activate', 'account-activation'],
    ['/user/bind-college-email', 'college-email-bind'],
  ] as const)('retains the email token on %s through failed retries', async (path, purpose) => {
    window.history.replaceState({}, '', `${path}#token=email-secret`)
    captureActionTokenFromUrl()
    document.body.innerHTML = '<div id="app"><article>已有内容</article></div>'
    const root = document.querySelector('#app')!
    const existing = root.querySelector('article')
    let finishRetry!: (response: unknown) => void
    const fetch = vi.fn()
      .mockRejectedValueOnce(new Error('Network unavailable'))
      .mockResolvedValueOnce({ ok: false })
      .mockImplementationOnce(() => new Promise((resolve) => { finishRetry = resolve }))
    vi.stubGlobal('fetch', fetch)
    const ready = loadSiteConfigWithRetry(root)

    await vi.waitFor(() => expect(root.querySelector('[role="alert"]')?.textContent).toContain('加载失败'))
    const button = root.querySelector('button')!
    button.click()
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(2))
    await vi.waitFor(() => expect(button.disabled).toBe(false))
    button.click()
    button.click()
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(3))
    expect(button.disabled).toBe(true)
    expect(root.querySelector('article')).toBe(existing)
    expect(root.querySelector('[data-site-loading]')).toBeNull()
    expect(getActionToken(purpose)).toBe('email-secret')
    expect(window.location.href).not.toContain('email-secret')
    finishRetry({ ok: true, json: async () => ({ ...siteConfig }) })
    await ready

    expect(root.querySelector('button')).toBeNull()
    expect(root.querySelector('article')).toBe(existing)
    expect(getActionToken(purpose)).toBe('email-secret')
  })

  it('continues immediately when configuration loads successfully', async () => {
    const root = document.createElement('div')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ...siteConfig }) }))
    await loadSiteConfigWithRetry(root)
    expect(root.childElementCount).toBe(0)
    expect(root.querySelector('button')).toBeNull()
  })
})
