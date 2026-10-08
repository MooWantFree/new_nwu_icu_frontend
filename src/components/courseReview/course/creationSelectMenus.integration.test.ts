import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick, ref, type App } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import AddCourseModal from './AddCourseModal.vue'
import AddTeacherModal from './AddTeacherModal.vue'

vi.hoisted(() => {
  // jsdom needs the initial resize notification to render virtual-list options.
  vi.stubGlobal('ResizeObserver', class {
    constructor(private callback: ResizeObserverCallback) {}
    observe(target: Element) {
      void Promise.resolve().then(() => this.callback([{ target, contentRect: target.getBoundingClientRect() } as ResizeObserverEntry], this as unknown as ResizeObserver))
    }
    unobserve() {}
    disconnect() {}
  })
})
const mocks = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), checkLoginStatus: vi.fn(), error: vi.fn(), success: vi.fn() }))
vi.mock('@/lib/requests', () => ({ api: { get: mocks.get, post: mocks.post } }))
vi.mock('@/lib/logins', () => ({ checkLoginStatus: mocks.checkLoginStatus }))
vi.mock('@/lib/useShadcnToast', () => ({ useShadcnToast: () => ({ error: mocks.error, success: mocks.success }) }))

let app: App | undefined
let host: HTMLDivElement
const originalScrollTo = Object.getOwnPropertyDescriptor(Element.prototype, 'scrollTo')
const flush = async () => {
  for (let index = 0; index < 15; index++) { await Promise.resolve(); await nextTick() }
}
const settle = async () => { await flush(); await vi.advanceTimersByTimeAsync(350); await flush() }
const dialog = (title: string) => [...document.body.querySelectorAll<HTMLElement>('[role="dialog"]')]
  .find(candidate => candidate.querySelector('h2')?.textContent === title && candidate.style.display !== 'none')!
const button = (target: HTMLElement, label: string) => [...target.querySelectorAll<HTMLButtonElement>('button')]
  .find(candidate => candidate.textContent?.trim() === label)!
const visibleMenu = () => [...document.body.querySelectorAll<HTMLElement>('[data-shadcn-select-menu]')]
  .find(candidate => candidate.style.display !== 'none')
const option = (label: string) => [...visibleMenu()!.querySelectorAll<HTMLElement>('[role="option"]')]
  .find(candidate => candidate.textContent?.trim() === label)!
const key = async (target: HTMLElement, value: string) => {
  target.dispatchEvent(new KeyboardEvent('keydown', { key: value, code: value, bubbles: true, cancelable: true }))
  await settle()
}
const select = (target: HTMLElement, index = 0) => target.querySelectorAll<HTMLElement>('[role="combobox"]')[index]!
const expectMenuScope = (target: HTMLElement) => {
  const menu = visibleMenu()!
  expect(menu).toBeDefined()
  // Portalled menus can extend beyond the dialog without being clipped.
  expect(target.contains(menu)).toBe(false)
  expect(target.querySelector('form')!.parentElement!.contains(menu)).toBe(false)
}
const mount = async (type: 'teacher' | 'course') => {
  const open = ref(false)
  const router = createRouter({ history: createMemoryHistory(), routes: [
    { path: '/review/course', component: { render: () => null } },
    { path: '/review/course/:id', name: 'courseReviewItem', component: { render: () => null } },
  ] })
  await router.push('/review/course')
  app = createApp({ render: () => type === 'teacher' ? h(AddTeacherModal, {
    modelValue: open.value,
    'onUpdate:modelValue': (value: boolean) => { open.value = value },
    initValue: { name: '新教师' },
  }) : h(AddCourseModal, {
    modelValue: open.value,
    'onUpdate:modelValue': (value: boolean) => { open.value = value },
    initValue: { name: '数学分析', teacher: { id: 9, name: '原教师', school: '数学学院' } },
  }) }).use(router)
  app.mount(host)
  await flush()
  open.value = true
  await settle()
  return { open, router }
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.resetAllMocks()
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: false, media: query, onchange: null,
    addListener: () => {}, removeListener: () => {},
    addEventListener: () => {}, removeEventListener: () => {}, dispatchEvent: () => true,
  }))
  Object.defineProperty(Element.prototype, 'scrollTo', { configurable: true, value: () => {} })
  Element.prototype.scrollIntoView = vi.fn()
  mocks.checkLoginStatus.mockResolvedValue(true)
  mocks.get.mockResolvedValue({ status: 200, data: { contents: { schools: [
    { id: 1, name: '数学学院' }, { id: 2, name: '物理学院' },
  ] } } })
  mocks.post.mockImplementation(({ url }) => Promise.resolve({ status: 200, data: { contents:
    url === '/api/assessment/teacher/' ? { teacher_id: 21 } : { course_id: 42 },
  } }))
  host = document.createElement('div')
  document.body.append(host)
})
afterEach(() => {
  app?.unmount()
  app = undefined
  host.remove()
  vi.clearAllTimers()
  vi.useRealTimers()
  vi.unstubAllGlobals()
  if (originalScrollTo) Object.defineProperty(Element.prototype, 'scrollTo', originalScrollTo)
  else Reflect.deleteProperty(Element.prototype, 'scrollTo')
})

describe('creation select menus with real modal and select components', () => {
  it('selects a teacher school by mouse and keyboard while Escape only dismisses the menu', async () => {
    const { open } = await mount('teacher')
    const teacher = dialog('添加教师')
    const school = select(teacher)
    school.click()
    await settle()
    expectMenuScope(teacher)
    option('物理学院').click()
    await settle()
    expect((school as HTMLInputElement).value).toBe('物理学院')
    expect(open.value).toBe(true)

    school.click()
    await settle()
    await key(school, 'Escape')
    expect(visibleMenu()).toBeUndefined()
    expect(open.value).toBe(true)
    expect(teacher.contains(document.activeElement)).toBe(true)
    await key(school, 'ArrowDown')
    expectMenuScope(teacher)
    await key(school, 'ArrowUp')
    await key(school, 'Enter')
    expect((school as HTMLInputElement).value).toBe('数学学院')
    expect(open.value).toBe(true)

    button(teacher, '添加教师').click()
    await settle()
    expect(mocks.post).toHaveBeenCalledWith({ url: '/api/assessment/teacher/', query: { name: '新教师', school: 1 } })
    expect(open.value).toBe(false)
    expect(mocks.error).not.toHaveBeenCalled()
  })

  it('uses the same menu scope for course school and classification without submitting on keyboard selection', async () => {
    const { open, router } = await mount('course')
    const course = dialog('添加课程')
    const school = select(course)
    school.click()
    await settle()
    expectMenuScope(course)
    option('物理学院').click()
    await settle()
    const classification = select(course, 1)
    await key(classification, 'ArrowDown')
    expectMenuScope(course)
    await key(document.activeElement as HTMLElement, 'Enter')
    expect(classification.textContent).toContain('通识课')
    expect(open.value).toBe(true)
    expect(mocks.post).not.toHaveBeenCalled()

    button(course, '添加课程').click()
    await settle()
    expect(mocks.post).toHaveBeenCalledWith({ url: '/api/assessment/course/', query: {
      name: '数学分析', school: 2, classification: 'general', teacher_ids: [9],
    } })
    expect(open.value).toBe(false)
    expect(router.currentRoute.value.path).toBe('/review/course/42')
    expect(mocks.error).not.toHaveBeenCalled()
  })
})
