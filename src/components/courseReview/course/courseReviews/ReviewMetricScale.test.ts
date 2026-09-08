import { afterEach, describe, expect, it } from 'vitest'
import { createApp, h, nextTick, ref, type App } from 'vue'
import ReviewMetricScale from './ReviewMetricScale.vue'
import { reviewMetrics } from '@/lib/reviewMetrics'

let app: App | undefined
let container: HTMLDivElement

afterEach(() => {
  app?.unmount()
  container?.remove()
})

describe('review metric direction', () => {
  it.each(Object.values(reviewMetrics))('keeps $key values unchanged while communicating their meaning', async (metric) => {
    const value = ref(3)
    container = document.createElement('div')
    document.body.append(container)
    app = createApp({ render: () => h(ReviewMetricScale, {
      ...metric,
      modelValue: value.value,
      'onUpdate:modelValue': (selection: number) => { value.value = selection },
    }) })
    app.mount(container)

    expect(container.querySelectorAll('.bg-slate-400')).toHaveLength(3)
    const choices = container.querySelectorAll<HTMLButtonElement>('[role="radio"]')
    choices[0].click()
    await nextTick()
    expect(value.value).toBe(1)
    expect(choices[0].getAttribute('aria-checked')).toBe('true')
    expect(container.querySelectorAll(metric.preference === 'lower' ? '.bg-teal-600' : '.bg-amber-500')).toHaveLength(1)

    choices[4].click()
    await nextTick()
    expect(value.value).toBe(5)
    expect(choices[4].getAttribute('aria-checked')).toBe('true')
    expect(container.querySelectorAll(metric.preference === 'lower' ? '.bg-amber-500' : '.bg-teal-600')).toHaveLength(5)
    expect(container.textContent).toContain(metric.levels[4])
  })
})
