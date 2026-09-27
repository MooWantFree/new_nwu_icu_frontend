import { MethodMap } from './base'
import type { ErrorFactory } from './errors'

export interface ArchiveTask {
  id: string
  status: 'queued' | 'running' | 'cancelling' | 'ready' | 'failed' | 'cancelled' | 'expired' | 'evicted'
  file_count: number
  paths: string[]
  source_bytes: number
  zip_bytes: number
  processed_bytes: number
  processed_files: number
  ahead: number
  expires_at: string | null
  created_at: string
  filename: string
  message: string
  transient?: boolean
}
export interface ArchiveConfig { max_files: number; max_bytes: number; idle_ttl: number; queue_limit: number; anonymous: boolean }
type Errors = ErrorFactory<string>[]
export type ArchiveConfigAPI = { endpoint: '/api/resources/archives/config/'; method: MethodMap.GET; response: ArchiveConfig; errors: Errors }
export type ArchiveListAPI = { endpoint: '/api/resources/archives/'; method: MethodMap.GET; query?: { current?: string }; response: { tasks: ArchiveTask[] }; errors: Errors }
export type ArchiveDetailAPI = { endpoint: '/api/resources/archives/:id/'; method: MethodMap.GET; params: { id: string }; response: { task: ArchiveTask }; errors: Errors }
export type ArchiveCreateAPI = {
  endpoint: '/api/resources/archives/'; method: MethodMap.POST
  query: { paths: string[]; request_key: string }
  response: { task: ArchiveTask; result: 'active' | 'existing' | 'reused' | 'created' }
  errors: Errors
}
export type ArchiveCancelAPI = {
  endpoint: '/api/resources/archives/:id/cancel/'; method: MethodMap.POST; params: { id: string }
  response: { task: ArchiveTask }; errors: Errors
}
export type ArchiveAuthorizeAPI = {
  endpoint: '/api/resources/archives/:id/authorize/'; method: MethodMap.POST; params: { id: string }
  response: { url: string; task: ArchiveTask }; errors: Errors
}
