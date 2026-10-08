import { onScopeDispose } from 'vue'
import { useFeedbackState, type ConfirmOptions, type FeedbackDialog, type PromptOptions } from './shadcnFeedback'

export function useShadcnDialog() {
  const state = useFeedbackState()
  const owned = new Set<FeedbackDialog>()
  const track = <T>(request: FeedbackDialog, promise: Promise<T>) => {
    owned.add(request)
    void promise.then(() => owned.delete(request))
    return promise
  }
  const confirm = (options: ConfirmOptions): Promise<boolean> => {
    const { request, promise } = state.openDialog<boolean>('confirm', options, false)
    return track(request, promise)
  }
  const prompt = (options: PromptOptions): Promise<string | null> => {
    const { request, promise } = state.openDialog<string | null>('prompt', options, null)
    return track(request, promise)
  }
  onScopeDispose(() => { for (const request of owned) request.cancel(); owned.clear() })
  return { confirm, prompt }
}
