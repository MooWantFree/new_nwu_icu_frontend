import { afterEach, describe, expect, it } from 'vitest'
import { pageTitle, setPageMetadata } from './pageMetadata'

afterEach(() => { setPageMetadata({ title: '主页' }) })

describe('page metadata', () => {
  it('uses the same brand suffix for normal and existing branded titles', () => {
    expect(pageTitle('时间线')).toBe('时间线 - NWU.ICU')
    expect(pageTitle('课程评价 - 高等数学 | NWU.ICU')).toBe('课程评价 - 高等数学 - NWU.ICU')
    expect(pageTitle('设置 - NWU.ICU')).toBe('设置 - NWU.ICU')
    expect(pageTitle('NWU.ICU')).toBe('主页 - NWU.ICU')
  })

  it('removes resource-specific metadata when navigating to another page', () => {
    setPageMetadata({ title: '资料未找到', noindex: true, canonical: 'https://nwu.icu/disk/a', description: '旧资料' })
    setPageMetadata({ title: '时间线' })
    expect(document.title).toBe('时间线 - NWU.ICU')
    expect(document.head.querySelector('link[rel="canonical"]')).toBeNull()
    expect(document.head.querySelector('meta[name="robots"]')).toBeNull()
    expect(document.head.querySelector('meta[name="description"]')).toBeNull()
  })
})
