const focusClasses = [
  'rounded-lg',
  'bg-blue-50/70',
  'ring-2',
  'ring-blue-200',
  'ring-offset-2',
  'transition-all',
  'duration-500',
  'ease-out',
]

const activeFocusClasses = [
  'bg-blue-50/70',
  'ring-2',
  'ring-blue-200',
  'ring-offset-2',
]

export const focusCourseReviewTarget = (element: HTMLElement) => {
  element.classList.add(...focusClasses)

  const clearFocusTimer = window.setTimeout(() => {
    element.classList.remove(...activeFocusClasses)
  }, 1600)
  const cleanupFocusTimer = window.setTimeout(() => {
    element.classList.remove(...focusClasses)
  }, 2200)

  return () => {
    window.clearTimeout(clearFocusTimer)
    window.clearTimeout(cleanupFocusTimer)
    element.classList.remove(...focusClasses)
  }
}
