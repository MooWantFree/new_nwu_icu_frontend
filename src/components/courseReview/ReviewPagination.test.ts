import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createApp, h, nextTick, ref, type App } from 'vue'
import ReviewPagination from './ReviewPagination.vue'

let app: App | undefined
let container: HTMLDivElement

beforeEach(() => {
  container = document.createElement('div')
  document.body.append(container)
})

afterEach(() => {
  app?.unmount()
  app = undefined
  container.remove()
})

const mountPagination = (initialPage: number, initialPageCount: number) => {
  const page = ref(initialPage)
  const pageCount = ref(initialPageCount)
  const emittedPages: number[] = []
  app = createApp({ render: () => h(ReviewPagination, {
    page: page.value,
    pageCount: pageCount.value,
    'onUpdate:page': (target: number) => { emittedPages.push(target) },
  }) })
  app.mount(container)
  return { page, pageCount, emittedPages }
}

const button = (label: string) => {
  const target = container.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)
  if (!target) throw new Error(`Missing pagination button: ${label}`)
  return target
}

const jumpInput = () => {
  const target = container.querySelector<HTMLInputElement>('input[aria-label="跳转到指定页"]')
  if (!target) throw new Error('Missing pagination jump input')
  return target
}

const submitJump = async (value: string) => {
  const input = jumpInput()
  input.value = value
  input.dispatchEvent(new Event('input', { bubbles: true }))
  await nextTick()
  const form = input.closest('form')
  if (!form) throw new Error('Missing pagination jump form')
  form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
  await nextTick()
}

describe('ReviewPagination', () => {
  it.each([
    { page: 1, total: 1, visible: [1] },
    { page: 3, total: 5, visible: [1, 2, 3, 4, 5] },
    { page: 3, total: 10, visible: [1, 2, 3, 10] },
    { page: 4, total: 10, visible: [1, 4, 10] },
    { page: 7, total: 10, visible: [1, 7, 10] },
    { page: 8, total: 10, visible: [1, 8, 9, 10] },
    { page: 10, total: 10, visible: [1, 8, 9, 10] },
  ])('shows the correct navigation window at page $page of $total', ({ page, total, visible }) => {
    mountPagination(page, total)
    const labels = Array.from(
      container.querySelectorAll<HTMLButtonElement>('button[aria-label^="第 "]'),
      target => target.getAttribute('aria-label'),
    )

    expect(labels).toEqual(visible.map(target => `第 ${target} 页`))
    expect(button(`第 ${page} 页`).getAttribute('aria-current')).toBe('page')
    expect(container.querySelectorAll('[aria-current="page"]')).toHaveLength(1)
    expect(button('上一页').disabled).toBe(page === 1)
    expect(button('下一页').disabled).toBe(page === total)
  })

  it('emits requested pages while keeping disabled and current-page actions inert', async () => {
    const { emittedPages, page } = mountPagination(1, 10)
    button('上一页').click()
    button('第 1 页').click()
    expect(emittedPages).toEqual([])

    button('下一页').click()
    button('第 10 页').click()
    expect(emittedPages).toEqual([2, 10])

    page.value = 10
    await nextTick()
    button('下一页').click()
    button('第 10 页').click()
    expect(emittedPages).toEqual([2, 10])
    button('上一页').click()
    expect(emittedPages).toEqual([2, 10, 9])
  })

  it('submits a valid page jump and avoids emitting a jump to the current page', async () => {
    const { emittedPages } = mountPagination(4, 10)
    expect(button('跳转').type).toBe('submit')
    await submitJump('4')
    expect(emittedPages).toEqual([])
    await submitJump('8')
    expect(emittedPages).toEqual([8])
  })

  it.each(['0', '2.5', 'abc', '11'])('rejects invalid page jump %s and restores the current page', async value => {
    const { emittedPages } = mountPagination(4, 10)
    await submitJump(value)
    expect(emittedPages).toEqual([])
    expect(jumpInput().value).toBe('4')
  })

  it('follows external page updates in the active button and jump input', async () => {
    const { page, emittedPages } = mountPagination(1, 10)
    const input = jumpInput()
    input.value = '6'
    input.dispatchEvent(new Event('input', { bubbles: true }))
    await nextTick()

    page.value = 8
    await nextTick()
    expect(button('第 8 页').getAttribute('aria-current')).toBe('page')
    expect(button('第 1 页').getAttribute('aria-current')).not.toBe('page')
    expect(jumpInput().value).toBe('8')
    expect(emittedPages).toEqual([])
  })
})
