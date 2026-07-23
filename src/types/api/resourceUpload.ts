import type { ErrorFactory, ErrorNotLogin } from '../errors'
import { MethodMap } from '../base'

export type ResourceUploadFile = {
  id: number
  original_name: string
  relative_path: string
  size: number
  size_display: string
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
  status: 'pending' | 'approved' | 'rejected'
  total_size: number
  total_size_display: string
  files: ResourceUploadFile[]
  created_at: string
  reviewed_at: string | null
  reviewed_by: {
    id: number
    username: string
    nickname: string
  } | null
  rejection_reason: string
  files_deleted_at: string | null
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
