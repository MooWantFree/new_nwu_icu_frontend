import { afterAll, describe, expect, it } from 'vitest'

import { isManagementPath, managementNavigationNeedsReload } from './managementRoute'
import Router from '@/router/Router'

afterAll(() => Router.options.history.destroy())

describe('management route isolation', () => {
  it('matches only the management route namespace', () => {
    expect(isManagementPath('/manage')).toBe(true)
    expect(isManagementPath('/manage/passkeys')).toBe(true)
    expect(isManagementPath('/management')).toBe(false)
  })

  it('requires a clean reload when entering management from the public app', () => {
    expect(managementNavigationNeedsReload('/', '/manage')).toBe(true)
    expect(managementNavigationNeedsReload('/manage', '/manage')).toBe(false)
    expect(managementNavigationNeedsReload('/manage', '/')).toBe(false)
  })

  it.each(['uploads', 'announcements', 'files', 'notifications', 'reports', 'about'])('keeps the production %s route in the management scope', section => {
    const route = Router.resolve(`/manage/${section}`)
    expect(route.name).toBe('manage')
    expect(route.params.section).toBe(section)
    expect(route.meta).toMatchObject({ isManagement: true, pageTitle: '管理员面板' })
    expect(managementNavigationNeedsReload('/', route.path)).toBe(true)
    expect(managementNavigationNeedsReload('/manage/files', route.path)).toBe(false)
  })
})
