import { MethodMap } from './base'
import type { ErrorFactory } from './errors'

type Endpoint = 'operations' | 'readme' | 'access' | 'index' | 'audit' | 'statistics'
type API<E extends Endpoint, M extends MethodMap, R, Q = never> = {
  endpoint: `/api/management/resources/${E}/`; method: M; response: R; query: Q
  errors: ErrorFactory<'auth' | 'passkey'>[]
}
export type AccessMode = 'public' | 'login' | 'admin'
export type ReadmeData = { path: string; content: string; version: string; warning: string }
export type AccessData = { path: string; mode: AccessMode; effective: AccessMode; rules: { path: string; mode: AccessMode }[] }
export type IndexData = { updated_at: string | null; summary: { directory_count: number; file_count: number; total_file_size: number } | null }
export type AuditData = { count: number; page: number; results: { id: number; actor: string; action: string; path: string; destination: string; detail: Record<string, unknown>; created_at: string }[] }
export type DownloadRecord = { id: number; path: string; created_at: string; ip_address: string | null; user_id: number | null; username: string; user_agent: string; authenticated: boolean }
export type StatisticsQuery = { days: number; page?: number; ip?: string; user_id?: number; ua?: string; search?: string }
export type StatisticsData = {
  total: number; authenticated: number; guest: number; days: number
  unique_ips: number; unique_users: number; unique_uas: number
  unknown_ip: number; unknown_ua: number; unknown_user: number
  daily: { date: string; count: number }[]; files: { path: string; count: number }[]
  ips: { ip_address: string; count: number }[]
  users: { user_id: number; username: string; count: number }[]
  uas: { user_agent: string; count: number }[]
  events: { count: number; page: number; page_size: number; results: DownloadRecord[] }
}
export type APIOperations = API<'operations', MethodMap.POST, { completed: number; failed: string[] },
  { action: 'mkdir'; path: string; name: string } | { action: 'purge'; trash_ids: string[]; confirmation: string }>
export type APIReadme = API<'readme', MethodMap.GET, ReadmeData, { path: string }>
export type APISaveReadme = API<'readme', MethodMap.POST, ReadmeData, Omit<ReadmeData, 'warning'>>
export type APIAccess = API<'access', MethodMap.GET, AccessData, { path: string }>
export type APISaveAccess = API<'access', MethodMap.POST, { effective: AccessMode }, { path: string; mode: AccessMode }>
export type APIIndex = API<'index', MethodMap.GET, IndexData>
export type APIReindex = API<'index', MethodMap.POST, IndexData>
export type APIAudit = API<'audit', MethodMap.GET, AuditData, { page: number; action: string; search: string }>
export type APIStatistics = API<'statistics', MethodMap.GET, StatisticsData, StatisticsQuery>
