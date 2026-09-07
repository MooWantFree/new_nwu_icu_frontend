import { describe, expect, it } from 'vitest'
import { renderResourceReadme, resourceFileUrl, resourcePageUrl } from './resourceBrowser'

describe('resource URLs and Markdown', () => {
  it('round-trips Chinese filenames with hashes, percent signs and ampersands', () => {
    const path = '/课程.2026/试卷 #1% &答案.pdf'
    expect(decodeURIComponent(resourcePageUrl(path).slice(5))).toBe(path)
    expect(new URL(resourceFileUrl(path), 'https://nwu.icu').searchParams.get('path')).toBe(path)
  })
  it('renders Markdown and removes executable HTML', async () => {
    const html = await renderResourceReadme('# 说明\n\n**加粗**<script>alert(1)</script><img src="javascript:alert(1)" onerror="alert(1)"><iframe src="/api"></iframe>', '/')
    expect(html).toContain('<h1>说明</h1>')
    expect(html).toContain('<strong>加粗</strong>')
    expect(html).not.toMatch(/<script|<iframe|onerror|javascript:/)
  })
  it('resolves relative file, folder and image paths within the current directory', async () => {
    const html = await renderResourceReadme('[文件](试卷.pdf)\n\n[上级](../英语/)\n\n![示意](图片.png)', '/课程')
    const doc = new DOMParser().parseFromString(html, 'text/html')
    expect(doc.querySelector('a')?.getAttribute('href')).toBe(resourcePageUrl('/课程/试卷.pdf'))
    expect(doc.querySelectorAll('a')[1].getAttribute('href')).toBe(resourcePageUrl('/英语/'))
    expect(doc.querySelector('img')?.getAttribute('src')).toBe(resourceFileUrl('/课程/图片.png', true))
  })
  it('keeps external links safe and prevents exposing README as a file', async () => {
    const html = await renderResourceReadme('[外链](https://example.com) [隐藏](README.md)', '/')
    const links = new DOMParser().parseFromString(html, 'text/html').querySelectorAll('a')
    expect(links[0].getAttribute('rel')).toBe('noopener noreferrer')
    expect(links[1].hasAttribute('href')).toBe(false)
  })
})
