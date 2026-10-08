<template>
  <TooltipProvider :delay-duration="250">
    <slot />
    <Teleport to="body">
      <div class="pointer-events-none fixed bottom-4 right-4 z-[300] flex max-w-[calc(100vw-2rem)] flex-col gap-3" aria-label="通知">
        <div v-for="message in state.messages" :key="message.id" class="pointer-events-auto"
          @mouseenter="setInteraction(message, 'hovered', true)" @mouseleave="setInteraction(message, 'hovered', false)"
          @focusin="setInteraction(message, 'focused', true)" @focusout="resumeAfterBlur($event, message)">
          <ShadcnToast :content="message.content" :type="message.type" :closable="message.closable" :icon="message.icon"
            @close="state.removeMessage(message, true)" />
        </div>
      </div>
    </Teleport>
    <ShadcnFeedbackDialog v-for="(dialog, index) in state.dialogs" :key="dialog.id" :request="dialog" :stack-index="index" />
  </TooltipProvider>
</template>

<script setup lang="ts">
import { onBeforeUnmount, provide } from 'vue'
import { TooltipProvider } from 'reka-ui'
import { createFeedbackState, feedbackKey, type MessageReactive } from '@/lib/shadcnFeedback'
import ShadcnToast from './ShadcnToast.vue'
import ShadcnFeedbackDialog from './ShadcnFeedbackDialog.vue'

const props = withDefaults(defineProps<{ max?: number }>(), { max: 3 })
const state = createFeedbackState(props.max)
provide(feedbackKey, state)
onBeforeUnmount(state.dispose)
const interactions = new WeakMap<MessageReactive, { hovered: boolean; focused: boolean }>()
const setInteraction = (message: MessageReactive, kind: 'hovered' | 'focused', value: boolean) => {
  const flags = interactions.get(message) ?? { hovered: false, focused: false }
  flags[kind] = value
  interactions.set(message, flags)
  if (flags.hovered || flags.focused) state.pause(message)
  else state.resume(message)
}
const resumeAfterBlur = (event: FocusEvent, message: MessageReactive) => {
  if (!(event.currentTarget as HTMLElement).contains(event.relatedTarget as Node | null)) setInteraction(message, 'focused', false)
}
</script>
