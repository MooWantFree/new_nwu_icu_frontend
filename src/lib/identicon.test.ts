import { describe, expect, it } from 'vitest'
import {
  createAvatarPlaceholderDataUrl,
  createIdenticonDataUrl,
} from './identicon'

function decodeSvg(dataUrl: string): string {
  return decodeURIComponent(dataUrl.slice(dataUrl.indexOf(',') + 1))
}

describe('identicon', () => {
  it('is deterministic for the same UUID', () => {
    const uuid = 'd9428888-122b-11e1-b85c-61cd3cbb3210'
    expect(createIdenticonDataUrl(uuid)).toBe(createIdenticonDataUrl(uuid))
  })

  it('normally differs for different UUIDs', () => {
    expect(createIdenticonDataUrl('00000000-0000-4000-8000-000000000001')).not.toBe(
      createIdenticonDataUrl('00000000-0000-4000-8000-000000000002')
    )
  })

  it('creates a valid symmetric 5 by 5 SVG pattern', () => {
    const svg = decodeSvg(
      createIdenticonDataUrl('f47ac10b-58cc-4372-a567-0e02b2c3d479')
    )
    expect(svg).toContain('<svg')
    expect(svg).toContain('viewBox="0 0 7 7"')

    const cells = [...svg.matchAll(/<rect x="(\d)" y="(\d)"/g)].map(
      (match) => `${match[1]},${match[2]}`
    )
    for (const cell of cells) {
      const [x, y] = cell.split(',').map(Number)
      expect(cells).toContain(`${6 - x},${y}`)
    }
  })

  it('provides a generic SVG placeholder', () => {
    expect(decodeSvg(createAvatarPlaceholderDataUrl())).toContain('<svg')
  })
})
