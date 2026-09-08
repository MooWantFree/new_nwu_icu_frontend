import { MethodMap } from './base'
import type { ErrorFactory } from './errors'

export type APIResourceFileAuthorize = {
  endpoint: '/api/resources/file/authorize/'
  method: MethodMap.POST
  query: { path: string; inline?: boolean }
  response: { url: string; expires_in: number | null; gate_enabled: boolean }
  errors: ErrorFactory<'captcha' | 'path'>[]
}
