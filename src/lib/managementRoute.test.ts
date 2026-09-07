import { describe, expect, it } from 'vitest'

import { isManagementPath, managementNavigationNeedsReload } from './managementRoute'

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
})
