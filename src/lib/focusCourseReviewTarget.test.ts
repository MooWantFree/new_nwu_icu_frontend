import { afterEach, describe, expect, it, vi } from 'vitest'
import { focusCourseReviewTarget } from './focusCourseReviewTarget'

afterEach(() => {
  vi.useRealTimers()
})

describe('focusCourseReviewTarget', () => {
  it('highlights reviews and replies with the same animation', () => {
    vi.useFakeTimers()
    const element = document.createElement('div')

    const cleanup = focusCourseReviewTarget(element)

    expect(element.classList.contains('bg-blue-50/70')).toBe(true)
    expect(element.classList.contains('ring-2')).toBe(true)
    expect(element.classList.contains('transition-all')).toBe(true)

    vi.advanceTimersByTime(1600)
    expect(element.classList.contains('bg-blue-50/70')).toBe(false)
    expect(element.classList.contains('ring-2')).toBe(false)
    expect(element.classList.contains('transition-all')).toBe(true)

    vi.advanceTimersByTime(600)
    expect(element.className).toBe('')

    cleanup()
  })
})
