import { hasInjectionContext, inject, nextTick, reactive, shallowReactive, type InjectionKey, type VNodeChild } from 'vue'

export type MessageType = 'default' | 'success' | 'error' | 'warning' | 'info' | 'loading'
export type MessageContent = string | number | (() => VNodeChild)
export type MessageOptions = {
  type?: MessageType
  duration?: number
  closable?: boolean
  keepAliveOnHover?: boolean
  icon?: () => VNodeChild
  onClose?: () => void
  onLeave?: () => void
  onAfterLeave?: () => void
}
export type MessageReactive = MessageOptions & {
  id: number
  content: MessageContent
  type: MessageType
  duration: number
  closable: boolean
  destroy: () => void
}
type MessageMethod = (content: MessageContent, options?: MessageOptions) => MessageReactive
export type MessageApi = {
  create: MessageMethod
  success: MessageMethod
  error: MessageMethod
  warning: MessageMethod
  info: MessageMethod
  loading: MessageMethod
  destroyAll: () => void
}
export type ConfirmOptions = {
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  destructive?: boolean
}
export type PromptOptions = Omit<ConfirmOptions, 'destructive'> & {
  placeholder?: string
  maxLength?: number
}
export type FeedbackDialog = {
  id: number
  kind: 'confirm' | 'prompt'
  options: ConfirmOptions & Pick<PromptOptions, 'placeholder' | 'maxLength'>
  value: string
  error: string
  restoreFocus: HTMLElement | null
  accept: () => void
  cancel: () => void
}

export function createFeedbackState(maxToasts = 3) {
  const messages = shallowReactive<MessageReactive[]>([])
  const dialogs = shallowReactive<FeedbackDialog[]>([])
  const timers = new Map<number, { timer?: ReturnType<typeof setTimeout>; remaining: number; startedAt: number }>()
  let nextId = 0
  const removeMessage = (message: MessageReactive, userClosed = false) => {
    const index = messages.indexOf(message)
    if (index < 0) return
    const clock = timers.get(message.id)
    if (clock?.timer) clearTimeout(clock.timer)
    timers.delete(message.id)
    messages.splice(index, 1)
    if (userClosed) message.onClose?.()
    message.onLeave?.()
    void nextTick(() => message.onAfterLeave?.())
  }
  const resume = (message: MessageReactive) => {
    const clock = timers.get(message.id)
    if (!clock || clock.timer || message.duration <= 0) return
    clock.startedAt = Date.now()
    clock.timer = setTimeout(() => removeMessage(message), Math.max(0, clock.remaining))
  }
  const pause = (message: MessageReactive) => {
    if (!message.keepAliveOnHover) return
    const clock = timers.get(message.id)
    if (!clock?.timer) return
    clearTimeout(clock.timer)
    clock.timer = undefined
    clock.remaining = Math.max(0, clock.remaining - (Date.now() - clock.startedAt))
  }
  const create: MessageMethod = (content, options = {}) => {
    const type = options.type ?? 'default'
    const message = reactive<MessageReactive>({
      ...options,
      id: ++nextId,
      content,
      type,
      duration: options.duration ?? (type === 'loading' ? 0 : type === 'error' ? 6000 : 4000),
      closable: options.closable ?? true,
      keepAliveOnHover: options.keepAliveOnHover ?? true,
      destroy: () => removeMessage(message),
    })
    while (messages.length >= maxToasts) removeMessage(messages[0])
    messages.push(message)
    timers.set(message.id, { remaining: message.duration, startedAt: Date.now() })
    resume(message)
    return message
  }
  const toast: MessageApi = {
    create,
    success: (content, options) => create(content, { ...options, type: 'success' }),
    error: (content, options) => create(content, { ...options, type: 'error' }),
    warning: (content, options) => create(content, { ...options, type: 'warning' }),
    info: (content, options) => create(content, { ...options, type: 'info' }),
    loading: (content, options) => create(content, { ...options, type: 'loading' }),
    destroyAll: () => [...messages].forEach(message => removeMessage(message)),
  }
  const openDialog = <T extends boolean | string | null>(kind: FeedbackDialog['kind'], options: FeedbackDialog['options'], cancelled: T) => {
    let finish!: (result: T) => void
    const promise = new Promise<T>(resolve => { finish = resolve })
    let settled = false
    const settle = (result: T) => {
      if (settled) return
      settled = true
      const index = dialogs.indexOf(request)
      if (index >= 0) dialogs.splice(index, 1)
      finish(result)
    }
    const request = reactive<FeedbackDialog>({
      id: ++nextId,
      kind,
      options,
      value: '',
      error: '',
      restoreFocus: document.activeElement instanceof HTMLElement ? document.activeElement : null,
      cancel: () => settle(cancelled),
      accept: () => {
        if (kind === 'prompt' && Array.from(request.value).length > (options.maxLength ?? 500)) {
          request.error = `说明不能超过 ${options.maxLength ?? 500} 字`
          return
        }
        settle((kind === 'confirm' ? true : request.value) as T)
      },
    })
    dialogs.push(request)
    return { request, promise }
  }
  const dispose = () => { toast.destroyAll(); [...dialogs].forEach(dialog => dialog.cancel()) }
  return { messages, dialogs, toast, removeMessage, pause, resume, openDialog, dispose }
}

export type FeedbackState = ReturnType<typeof createFeedbackState>
export const feedbackKey: InjectionKey<FeedbackState> = Symbol('shadcn-feedback')
const fallback = createFeedbackState()
export const useFeedbackState = () => hasInjectionContext() ? inject(feedbackKey, fallback) : fallback
