export const REQUEST_TIMEOUT_MS = 15_000
export const UPLOAD_TIMEOUT_MS = 60_000

export function requestSignal(signal?: AbortSignal | null, timeout = REQUEST_TIMEOUT_MS) {
  const deadline = AbortSignal.timeout(timeout)
  return signal ? AbortSignal.any([signal, deadline]) : deadline
}
