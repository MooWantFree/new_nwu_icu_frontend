import type {
  AuthenticationResponseJSON,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
} from '@simplewebauthn/browser'
import type { ErrorFactory } from './errors'
import { MethodMap } from './base'
import type { GuestbookEntry } from './guestbook'
import type { ResourceUploadRequest } from './resourceUpload'

export type ManagementPermissions = {
  moderate_reports: boolean
  publish_announcements: boolean
  review_resource_uploads: boolean
}

export type ManagementSession = {
  passkey_enrolled: boolean
  passkey_count: number
  elevated: boolean
  elevated_until: number | null
  permissions: ManagementPermissions
}

export type ManagementReport = {
  id: number
  reason: 'spam' | 'abuse' | 'privacy' | 'other'
  detail: string
  status: 'pending' | 'dismissed' | 'removed'
  handling_note: string
  created_at: string
  handled_at: string | null
  reporter: { id: number; username: string; nickname: string }
  entry: {
    id: number
    board: 'guestbook' | 'announcement'
    title: string
    content: string
    is_deleted: boolean
    parent_id: number | null
    root_id: number | null
    author: { id: number; username: string; nickname: string }
    parent_content: string
  }
}

type Page<T> = { page: number; max_page: number; count: number; results: T[] }
type ManagementErrors = ErrorFactory<'auth' | 'passkey'>[]

export type APIManagementSession = {
  endpoint: '/api/management/session/'
  method: MethodMap.GET
  response: ManagementSession
  errors: ManagementErrors
}

export type APIManagementPasskeyAuthenticationOptions = {
  endpoint: '/api/management/passkeys/authentication/options/'
  method: MethodMap.POST
  response: PublicKeyCredentialRequestOptionsJSON
  errors: ManagementErrors
}

export type APIManagementPasskeyAuthenticationVerify = {
  endpoint: '/api/management/passkeys/authentication/verify/'
  method: MethodMap.POST
  query: { credential: AuthenticationResponseJSON }
  response: { elevated_until: string }
  errors: ManagementErrors
}

export type APIManagementPasskeyRegistrationOptions = {
  endpoint: '/api/management/passkeys/registration/options/'
  method: MethodMap.POST
  query: { enrollment_code: string; name: string }
  response: PublicKeyCredentialCreationOptionsJSON
  errors: ManagementErrors
}

export type APIManagementPasskeyRegistrationVerify = {
  endpoint: '/api/management/passkeys/registration/verify/'
  method: MethodMap.POST
  query: { credential: RegistrationResponseJSON }
  response: { credential: { id: number; name: string }; elevated_until: string }
  errors: ManagementErrors
}

export type APIManagementReportList = {
  endpoint: '/api/management/reports/'
  method: MethodMap.GET
  query: { status?: 'pending' | 'dismissed' | 'removed'; board?: 'guestbook' | 'announcement'; page?: number; pageSize?: number }
  response: Page<ManagementReport>
  errors: ManagementErrors
}

export type APIManagementReportResolve = {
  endpoint: '/api/management/reports/:id/resolve/'
  method: MethodMap.POST
  params: { id: number }
  query: { decision: 'dismiss' | 'remove'; note: string }
  response: { report_ids: number[] }
  errors: ManagementErrors
}

export type APIManagementAnnouncementCreate = {
  endpoint: '/api/management/announcements/'
  method: MethodMap.POST
  query: { title: string; content: string; submission_id: string }
  response: { entry: GuestbookEntry; created: boolean }
  errors: ManagementErrors
}

export type APIManagementUploadList = {
  endpoint: '/api/management/uploads/'
  method: MethodMap.GET
  query: { status?: ResourceUploadRequest['status']; page?: number; pageSize?: number }
  response: Page<ResourceUploadRequest>
  errors: ManagementErrors
}

export type APIManagementUploadDetail = {
  endpoint: '/api/management/uploads/:id/'
  method: MethodMap.GET
  params: { id: number }
  response: { upload_request: ResourceUploadRequest }
  errors: ManagementErrors
}

export type APIManagementUploadReview = {
  endpoint: '/api/management/uploads/:id/'
  method: MethodMap.POST
  params: { id: number }
  query: {
    action: 'approve' | 'reject' | 'retry'
    expected_revision: number
    target_path?: string
    reason?: string
  }
  response: { upload_request: ResourceUploadRequest }
  errors: ManagementErrors
}

