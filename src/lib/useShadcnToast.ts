import { h } from 'vue'
import { useMessage, type MessageApi, type MessageRenderMessage, type MessageType } from 'naive-ui'
import ShadcnToast from '@/components/common/ShadcnToast.vue'

const renderToast: MessageRenderMessage = ({ content, type, closable, icon, onClose }) => h(ShadcnToast, {
  content,
  type,
  closable,
  icon,
  onClose,
})

export function useShadcnToast(): MessageApi {
  const message = useMessage()
  const create: MessageApi['create'] = (content, options = {}) => {
    const type: MessageType = options.type ?? 'default'
    return message.create(content, {
      duration: type === 'error' ? 6000 : type === 'loading' ? 0 : 4000,
      closable: true,
      keepAliveOnHover: true,
      ...options,
      render: renderToast,
    })
  }

  return {
    create,
    success: (content, options) => create(content, { ...options, type: 'success' }),
    error: (content, options) => create(content, { ...options, type: 'error' }),
    warning: (content, options) => create(content, { ...options, type: 'warning' }),
    info: (content, options) => create(content, { ...options, type: 'info' }),
    loading: (content, options) => create(content, { ...options, type: 'loading' }),
    destroyAll: message.destroyAll,
  }
}
