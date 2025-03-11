import { ErrorFactory } from '../errors'
import { MethodMap } from '../base'

// POST
// 上传文件
export type APIUploadFile = {
  endpoint: '/api/upload/'
  method: MethodMap.POST
  query: FormData
  response: {
    uuid: string
  }
  errors: ErrorFactory<'file'>[]
}

// GET
// 下载文件
export type APIFileDownload = {
  endpoint: `/api/download/${string}/`
  method: MethodMap.GET
  response: any
  errors: ErrorFactory<'file'>[]
}

// DELETE
// 删除文件
export type APIFileDelete = {
  endpoint: `/api/file/${string}/`
  method: MethodMap.DELETE
  response: {}
  errors: ErrorFactory<'auth' | 'file'>[]
}
