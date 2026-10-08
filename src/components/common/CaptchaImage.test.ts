import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick, reactive, type App } from 'vue'
import CaptchaImage from './CaptchaImage.vue'

type ImageProps = {
  imageUrl: string
  loading?: boolean
  imageFit?: 'cover' | 'contain'
  appearance?: 'default' | 'shadcn'
  disabled?: boolean
}

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

function mountImage(initialProps: ImageProps) {
  const props = reactive({ ...initialProps })
  const refresh = vi.fn()
  const error = vi.fn()
  app = createApp({
    render: () => h(CaptchaImage, { ...props, onRefresh: refresh, onError: error }),
  })
  app.mount(container)

  return {
    refresh,
    error,
    async update(nextProps: Partial<ImageProps>) {
      Object.assign(props, nextProps)
      await nextTick()
    },
  }
}

function button() {
  const element = container.querySelector<HTMLButtonElement>('button')
  expect(element).not.toBeNull()
  return element!
}

function image() {
  const element = container.querySelector<HTMLImageElement>('img')
  expect(element).not.toBeNull()
  return element!
}

function expectHidden(element: HTMLImageElement, hidden: boolean) {
  const style = getComputedStyle(element)
  // jsdom does not load the app's generated Tailwind stylesheet.
  const isHidden = style.visibility === 'hidden'
    || style.display === 'none'
    || style.opacity === '0'
    || element.classList.contains('invisible')
    || element.classList.contains('opacity-0')
  expect(isHidden).toBe(hidden)
}

function expectBusy(busy: boolean) {
  expect(button().disabled).toBe(busy)
  expect(button().getAttribute('aria-busy')).toBe(String(busy))
  const status = container.querySelector('[role="status"]')
  if (busy) {
    expect(status).not.toBeNull()
    expect(status?.getAttribute('aria-label')).toBe('正在刷新')
    expect(status?.textContent?.trim()).toBe('')
  } else {
    expect(status).toBeNull()
  }
}

describe('CaptchaImage refresh lifecycle', () => {
  it('prevents refreshing while its parent is submitting without changing the loaded image', async () => {
    const { update, refresh } = mountImage({ imageUrl: '/captcha-loaded.png', appearance: 'shadcn' })
    image().dispatchEvent(new Event('load'))
    await nextTick()
    expectBusy(false)

    await update({ disabled: true })
    expect(button().disabled).toBe(true)
    expect(button().getAttribute('aria-busy')).toBe('false')
    expectHidden(image(), false)
    button().dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(refresh).not.toHaveBeenCalled()

    await update({ disabled: false })
    expectBusy(false)
    button().click()
    expect(refresh).toHaveBeenCalledOnce()
  })

  it('keeps the animation through the API response until the replacement image loads', async () => {
    const { update, refresh } = mountImage({ imageUrl: '', loading: true })
    expect(button().type).toBe('button')
    expect(button().getAttribute('aria-label')).toBe('刷新验证码')
    expectBusy(true)
    button().click()
    expect(refresh).not.toHaveBeenCalled()

    await update({ imageUrl: '/captcha-a.png', loading: false })
    const pendingImage = image()
    expect(pendingImage.getAttribute('alt')).toBe('')
    expectHidden(pendingImage, true)
    expectBusy(true)
    expect(button().textContent?.trim()).toBe('')
    button().click()
    expect(refresh).not.toHaveBeenCalled()

    pendingImage.dispatchEvent(new Event('load'))
    await nextTick()
    expectHidden(image(), false)
    expectBusy(false)
    button().click()
    expect(refresh).toHaveBeenCalledTimes(1)
  })

  it('stops animating and allows retry when the API settles without an image', async () => {
    const { update, refresh } = mountImage({ imageUrl: '', loading: true })
    expectBusy(true)

    await update({ loading: false })
    expectBusy(false)
    expect(container.querySelector('img')).toBeNull()
    button().click()
    expect(refresh).toHaveBeenCalledTimes(1)

    await update({ loading: true })
    expectBusy(true)
    await update({ loading: false })
    expectBusy(false)
    button().click()
    expect(refresh).toHaveBeenCalledTimes(2)
  })

  it('allows retry of the same URL after an image error and waits for that retry to load', async () => {
    const { update, refresh, error } = mountImage({ imageUrl: '/captcha-same.png' })
    expectBusy(true)
    image().dispatchEvent(new Event('error'))
    await nextTick()
    expect(error).toHaveBeenCalledTimes(1)
    expectBusy(false)
    const failedImage = container.querySelector<HTMLImageElement>('img')
    if (failedImage) expectHidden(failedImage, true)

    button().click()
    expect(refresh).toHaveBeenCalledTimes(1)
    await update({ loading: true })
    expectBusy(true)
    await update({ loading: false })
    expect(image().getAttribute('src')).toBe('/captcha-same.png')
    expectHidden(image(), true)
    expectBusy(true)

    image().dispatchEvent(new Event('load'))
    await nextTick()
    expectBusy(false)
    expectHidden(image(), false)
    expect(error).toHaveBeenCalledTimes(1)
  })

  it('ignores load and error events from an image replaced by a newer URL', async () => {
    const { update, error } = mountImage({ imageUrl: '/captcha-old.png' })
    const oldImage = image()
    await update({ imageUrl: '/captcha-new.png' })
    const replacementImage = image()
    expect(replacementImage).not.toBe(oldImage)

    oldImage.dispatchEvent(new Event('load'))
    oldImage.dispatchEvent(new Event('error'))
    await nextTick()
    expectBusy(true)
    expectHidden(replacementImage, true)
    expect(error).not.toHaveBeenCalled()

    replacementImage.dispatchEvent(new Event('load'))
    await nextTick()
    expectBusy(false)
    expectHidden(image(), false)
    oldImage.dispatchEvent(new Event('error'))
    await nextTick()
    expect(error).not.toHaveBeenCalled()
    expectBusy(false)
    expectHidden(image(), false)
  })

  it('resets the image loading state on consecutive refreshes', async () => {
    const { update, refresh } = mountImage({ imageUrl: '/captcha-initial.png' })
    image().dispatchEvent(new Event('load'))
    await nextTick()
    expectBusy(false)

    for (let index = 1; index <= 3; index += 1) {
      button().click()
      expect(refresh).toHaveBeenCalledTimes(index)
      await update({ imageUrl: '', loading: true })
      expectBusy(true)
      await update({ imageUrl: `/captcha-${index}.png`, loading: false })
      expectBusy(true)
      expectHidden(image(), true)
      button().click()
      expect(refresh).toHaveBeenCalledTimes(index)

      image().dispatchEvent(new Event('load'))
      await nextTick()
      expectBusy(false)
      expectHidden(image(), false)
    }
  })
})
