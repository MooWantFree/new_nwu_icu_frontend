const IDENTICON_BACKGROUND = '#f0f3f6'

function hashUuid(value: string): number {
  let hash = 0x811c9dc5
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

function nextRandom(state: number): number {
  let value = state || 0x9e3779b9
  value ^= value << 13
  value ^= value >>> 17
  value ^= value << 5
  return value >>> 0
}

function svgDataUrl(svg: string): string {
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

export function createIdenticonDataUrl(uuid: string): string {
  let state = hashUuid(uuid.trim().toLowerCase())
  const hue = state % 360
  const color = `hsl(${hue} 65% 42%)`
  const cells: string[] = []

  for (let row = 0; row < 5; row += 1) {
    for (let column = 0; column < 3; column += 1) {
      state = nextRandom(state)
      if ((state & 1) === 0) continue
      cells.push(`<rect x="${column + 1}" y="${row + 1}" width="1" height="1"/>`)
      if (column < 2) {
        cells.push(`<rect x="${5 - column}" y="${row + 1}" width="1" height="1"/>`)
      }
    }
  }

  if (cells.length === 0) {
    cells.push('<rect x="3" y="3" width="1" height="1"/>')
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 7 7" shape-rendering="crispEdges"><rect width="7" height="7" fill="${IDENTICON_BACKGROUND}"/><g fill="${color}">${cells.join('')}</g></svg>`
  return svgDataUrl(svg)
}

export function createAvatarPlaceholderDataUrl(): string {
  return svgDataUrl(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect width="24" height="24" fill="#e5e7eb"/><circle cx="12" cy="9" r="4" fill="#9ca3af"/><path d="M4 22a8 8 0 0 1 16 0" fill="#9ca3af"/></svg>'
  )
}
