import type { ErrorFactory, ErrorNotLogin } from './errors'
import { MethodMap } from './base'

export type ResourceUploadFile = {
  id: number
  original_name: string
  relative_path: string
  size: number
  size_display: string
  published_path: string
  published_at: string | null
}

export type ResourceUploadRequest = {
  id: number
  uploaded_by: {
    id: number
    username: string
    nickname: string
  }
  target_path: string
  creates_new_folder: boolean
  status: 'pending' | 'publishing' | 'approved' | 'rejected' | 'publish_failed'
  total_size: number
  total_size_display: string
  files: ResourceUploadFile[]
  created_at: string
  updated_at: string
  revision: number
  reviewed_at: string | null
  reviewed_by: {
    id: number
    username: string
    nickname: string
  } | null
  rejection_reason: string
  publish_error: string
  files_deleted_at: string | null
  files_expires_at: string | null
  can_edit: boolean
  resource_url: string | null
}

type ResourceUploadErrors =
  | ErrorNotLogin
  | 'directory'
  | 'files'
  | 'relative_paths'
  | 'target_path'
  | 'new_folder_name'

export type APIResourceDirectories = {
  endpoint: '/api/upload/directories/'
  method: MethodMap.GET
  query: {
    path: string
  }
  response: {
    path: string
    updated_at: string | null
    directories: {
      name: string
      path: string
      modified: string | null
    }[]
  }
  errors: ErrorFactory<ResourceUploadErrors>[]
}

export type APIResourceUploadConfig = {
  endpoint: '/api/upload/config/'
  method: MethodMap.GET
  response: {
    max_file_size: number
    max_file_count: number
    allowed_extensions: string[]
    quota: {
      limit: number
      used: number
      remaining: number
    }
  }
  errors: ErrorFactory<ResourceUploadErrors>[]
}

export type APIResourceUploadList = {
  endpoint: '/api/upload/request/'
  method: MethodMap.GET
  response: {
    upload_requests: ResourceUploadRequest[]
  }
  errors: ErrorFactory<ResourceUploadErrors>[]
}

export type APIResourceUploadCreate = {
  endpoint: '/api/upload/request/'
  method: MethodMap.POST
  query: FormData
  response: {
    upload_request: ResourceUploadRequest
  }
  errors: ErrorFactory<ResourceUploadErrors>[]
}

export type APIResourceUploadUpdate = {
  endpoint: '/api/upload/request/:requestId/'
  method: MethodMap.PUT
  params: {
    requestId: number
  }
  query: FormData
  response: {
    upload_request: ResourceUploadRequest
  }
  errors: ErrorFactory<ResourceUploadErrors | 'upload_request' | 'remove_file_ids' | 'expected_revision'>[]
}
