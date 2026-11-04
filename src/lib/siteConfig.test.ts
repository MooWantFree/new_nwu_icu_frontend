import { afterEach, describe, expect, it, vi } from 'vitest'
import { loadSiteConfig, siteConfig, isCollegeEmail, isRegistrationEmailBlocked } from './siteConfig'
import { pageTitle } from './pageMetadata'
import { resourceMetadata } from './resourceBrowser'
import { initializeStatistics } from './analytics'

afterEach(() => {
  vi.unstubAllGlobals()
  document.querySelectorAll('script[data-website-id], #site-config-bootstrap').forEach((node) => node.remove())
})

describe('runtime site configuration', () => {
  it('uses the configuration in the document without making another request', async () => {
    const bootstrap = document.createElement('script')
    bootstrap.id = 'site-config-bootstrap'
    bootstrap.type = 'application/json'
    bootstrap.textContent = JSON.stringify({ ...siteConfig, site_name: 'Document campus' })
    document.body.append(bootstrap)
    const fetch = vi.fn()
    vi.stubGlobal('fetch', fetch)
    await loadSiteConfig()
    expect(siteConfig.site_name).toBe('Document campus')
    expect(fetch).not.toHaveBeenCalled()
    expect(document.getElementById('site-config-bootstrap')).toBeNull()
  })

  it.each(['{', JSON.stringify({ site_name: 'incomplete' })])('recovers from invalid embedded configuration: %s', async (value) => {
    const bootstrap = document.createElement('script')
    bootstrap.id = 'site-config-bootstrap'
    bootstrap.type = 'application/json'
    bootstrap.textContent = value
    document.body.append(bootstrap)
    const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ...siteConfig, site_name: 'Fresh config' }) })
    vi.stubGlobal('fetch', fetch)
    await loadSiteConfig()
    expect(siteConfig.site_name).toBe('Fresh config')
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(document.getElementById('site-config-bootstrap')).toBeNull()
  })

  it('changes names, canonical URLs, links and email validation without rebuilding', async () => {
    const config = { ...siteConfig, site_name: 'Campus [A]', site_origin: 'https://campus.example.org',
      college_email_domains: ['staff.example.org', 'student.example.org'],
      registration_blocked_email_domains: ['example.org'],
      navigation_links: [{ label: '校园门户', url: 'https://portal.example.org' }],
    }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => config }))
    await loadSiteConfig()
    expect(pageTitle('课程 - Campus [A]')).toBe('课程 - Campus [A]')
    expect(resourceMetadata({ name: '', path: '/', type: 'directory', size: null, modified_at: '', readme: '', readme_warning: '' }))
      .toMatchObject({ canonical: 'https://campus.example.org/disk', description: '浏览和下载 Campus [A] 公开学习资料。' })
    expect(siteConfig.navigation_links).toEqual(config.navigation_links)
    expect(isCollegeEmail('A@STUDENT.EXAMPLE.ORG')).toBe(true)
    expect(isCollegeEmail('a@nwu.edu.cn')).toBe(false)
    expect(isCollegeEmail('a@evilstudent.example.org')).toBe(false)
    expect(isRegistrationEmailBlocked('a@student.example.org')).toBe(true)
    expect(isRegistrationEmailBlocked('a@notexample.org')).toBe(false)
  })

  it('rejects a failed or unsafe configuration without replacing the current settings', async () => {
    const originalName = siteConfig.site_name
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))
    await expect(loadSiteConfig()).rejects.toThrow()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({
      ...siteConfig, site_name: 'changed', navigation_links: [{ label: 'bad', url: 'javascript:alert(1)' }],
    }) }))
    await expect(loadSiteConfig()).rejects.toThrow()
    expect(siteConfig.site_name).toBe(originalName)
  })

  it('loads statistics only with an explicitly configured ID and matching domain', () => {
    initializeStatistics()
    expect(document.querySelector('script[data-website-id]')).toBeNull()
    siteConfig.analytics = { website_id: 'own-site', domains: ['different.example.org'] }
    initializeStatistics()
    expect(document.querySelector('script[data-website-id]')).toBeNull()
    siteConfig.analytics.domains = [window.location.hostname]
    initializeStatistics()
    expect(document.querySelector<HTMLScriptElement>('script[data-website-id]')?.dataset.websiteId).toBe('own-site')
  })
})
