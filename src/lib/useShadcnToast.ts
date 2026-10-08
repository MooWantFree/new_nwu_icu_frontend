import { useFeedbackState } from './shadcnFeedback'

export type { MessageApi, MessageContent, MessageOptions, MessageReactive, MessageType } from './shadcnFeedback'

export const useShadcnToast = () => useFeedbackState().toast
