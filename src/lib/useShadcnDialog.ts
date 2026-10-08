import { h, nextTick, onScopeDispose, ref, useId, type HTMLAttributes } from 'vue'
import { useDialog, type DialogOptions, type DialogReactive } from 'naive-ui'

type ConfirmOptions = {
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  destructive?: boolean
}
type PromptOptions = Omit<ConfirmOptions, 'destructive'> & {
  placeholder?: string
  maxLength?: number
}
type AccessibleDialogOptions = DialogOptions
  & Pick<HTMLAttributes, 'aria-label' | 'aria-describedby' | 'aria-modal'>

const baseOptions: AccessibleDialogOptions = {
  type: 'default',
  showIcon: false,
  bordered: true,
  autoFocus: true,
  maskClosable: true,
  closeOnEsc: true,
  style: {
    width: '420px',
    maxWidth: 'calc(100vw - 2rem)',
    '--n-color': '#ffffff',
    '--n-text-color': '#71717a',
    '--n-title-text-color': '#09090b',
    '--n-border': '1px solid #e4e4e7',
    '--n-border-radius': '12px',
    '--n-title-font-size': '16px',
    '--n-padding': '24px',
    '--n-close-icon-color': '#71717a',
    '--n-close-icon-color-hover': '#09090b',
    '--n-close-icon-color-pressed': '#09090b',
    '--n-close-color-hover': '#f4f4f5',
    '--n-close-color-pressed': '#e4e4e7',
  },
  titleClass: 'text-base font-semibold tracking-tight',
  contentClass: 'text-sm leading-6 break-words',
  positiveButtonProps: {
    type: 'default',
    size: 'medium',
    themeOverrides: {
      borderRadiusMedium: '6px', heightMedium: '40px',
      color: '#09090b', colorHover: '#27272a', colorPressed: '#18181b', colorFocus: '#09090b',
      textColor: '#ffffff', textColorHover: '#ffffff', textColorPressed: '#ffffff', textColorFocus: '#ffffff',
      border: '1px solid #09090b', borderHover: '1px solid #27272a', borderPressed: '1px solid #18181b',
      borderFocus: '1px solid #09090b', rippleColor: '#a1a1aa',
    },
  },
  negativeButtonProps: {
    type: 'default',
    size: 'medium',
    ghost: false,
    themeOverrides: {
      borderRadiusMedium: '6px', heightMedium: '40px',
      color: '#ffffff', colorHover: '#f4f4f5', colorPressed: '#e4e4e7', colorFocus: '#ffffff',
      textColor: '#18181b', textColorHover: '#09090b', textColorPressed: '#09090b', textColorFocus: '#18181b',
      border: '1px solid #e4e4e7', borderHover: '1px solid #d4d4d8', borderPressed: '1px solid #d4d4d8',
      borderFocus: '1px solid #a1a1aa', rippleColor: '#a1a1aa',
    },
  },
}

export function useShadcnDialog() {
  const dialog = useDialog()
  const id = useId()
  let dialogIndex = 0
  const active = new Set<{ instance: DialogReactive; cancel: () => void }>()

  const open = <T>(options: AccessibleDialogOptions, cancelled: T, accept: () => T | false): Promise<T> =>
    new Promise(resolve => {
      let settled = false
      const finish = (value: T) => { if (!settled) { settled = true; resolve(value) } }
      const record = {
        instance: dialog.create({
          ...baseOptions,
          ...options,
          onPositiveClick: () => {
            const value = accept()
            if (value === false) return false
            finish(value)
          },
          onNegativeClick: () => { finish(cancelled) },
          onClose: () => { finish(cancelled) },
          onMaskClick: () => { finish(cancelled) },
          onEsc: () => { finish(cancelled) },
          onAfterLeave: () => { finish(cancelled); active.delete(record) },
        }),
        cancel: () => { finish(cancelled) },
      }
      active.add(record)
    })

  const confirm = (options: ConfirmOptions): Promise<boolean> => {
    const descriptionId = `shadcn-dialog-${id}-${++dialogIndex}-description`
    return open<boolean>({
      title: options.title,
      content: () => h('p', { id: descriptionId }, options.description),
      'aria-label': options.title,
      'aria-describedby': descriptionId,
      'aria-modal': true,
      positiveText: options.confirmText ?? (options.destructive ? '删除' : '确认'),
      negativeText: options.cancelText ?? '取消',
    }, false, () => true)
  }

  const prompt = (options: PromptOptions): Promise<string | null> => {
    const value = ref('')
    const error = ref('')
    const inputId = `shadcn-prompt-${id}-${++dialogIndex}`
    const descriptionId = `${inputId}-description`
    const errorId = `${inputId}-error`
    const helpId = `${inputId}-help`
    const limit = options.maxLength ?? 500
    return open<string | null>({
      title: options.title,
      'aria-label': options.title,
      'aria-describedby': descriptionId,
      'aria-modal': true,
      positiveText: options.confirmText ?? '提交',
      negativeText: options.cancelText ?? '取消',
      content: () => h('div', { class: 'space-y-3' }, [
        h('p', { id: descriptionId }, options.description),
        h('label', { for: inputId, class: 'sr-only' }, '补充说明'),
        h('textarea', {
          id: inputId,
          rows: 4,
          placeholder: options.placeholder,
          value: value.value,
          'aria-invalid': Boolean(error.value),
          'aria-describedby': error.value ? `${helpId} ${errorId}` : helpId,
          class: 'block w-full resize-y rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm leading-6 text-zinc-950 shadow-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2',
          onInput: (event: Event) => { value.value = (event.target as HTMLTextAreaElement).value; error.value = '' },
        }),
        h('p', { id: helpId, class: 'text-xs text-zinc-500' }, `${Array.from(value.value).length} / ${limit}`),
        error.value ? h('p', { id: errorId, role: 'alert', class: 'text-xs text-red-600' }, error.value) : null,
      ]),
      onAfterEnter: () => { document.getElementById(inputId)?.focus({ preventScroll: true }) },
    }, null, () => {
      if (Array.from(value.value).length > limit) {
        error.value = `说明不能超过 ${limit} 字`
        void nextTick(() => document.getElementById(inputId)?.focus({ preventScroll: true }))
        return false
      }
      return value.value
    })
  }

  onScopeDispose(() => {
    for (const record of active) { record.cancel(); record.instance.destroy() }
    active.clear()
  })
  return { confirm, prompt }
}
