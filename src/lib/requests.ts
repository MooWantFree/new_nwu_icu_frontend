import { APIBase, MethodMap } from '@/types/api/base'
import { RequestEndpoints } from '@/types/api'

type APIResponse<T extends APIBase> = {
  message: T['message'] extends string ? T['message'] : string
  errors?: T['errors']
  contents: T['response']
}

async function request<T extends APIBase>({
  method,
  url,
  query,
  options,
  onUploadProgress,
}: {
  method: MethodMap
  url: string
  query?: T['query']
  options?: RequestInit
  // Callback function to track upload progress
  onUploadProgress?: (progressEvent: { loaded: number; total?: number }) => void
}): Promise<{
  status: number
  data: APIResponse<T>
  content: T['response']
  errors: T['errors']
}> {
  let fullUrl = `${url}`

  const defaultOptions: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': getCsrfToken(),
    },
    credentials: 'include',
  }

  const mergedOptions: RequestInit = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options?.headers,
    },
  }

  if (query) {
    if (method === MethodMap.GET) {
      const searchParams = new URLSearchParams()
      Object.entries(query).forEach(([key, value]) => {
        searchParams.set(key, String(value))
      })
      fullUrl += `?${searchParams.toString()}`
    }
    else if (query instanceof FormData || query instanceof File) {
      delete (mergedOptions.headers as Record<string, string>)['Content-Type']
      
      // Use XHR for upload progress tracking
      if (onUploadProgress) {
        // Temporarily use XHR, as fetch currently doesn't support upload progress
        return new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest()
          xhr.open(method, fullUrl)
          
          // Copy headers from mergedOptions
          Object.entries(mergedOptions.headers || {}).forEach(([key, value]) => {
            xhr.setRequestHeader(key, value as string)
          })
          
          // Track upload progress
          xhr.upload.onprogress = event => onUploadProgress({
            loaded: event.loaded,
            total: event.lengthComputable ? event.total : undefined
          })
          
          // Handle response
          xhr.onload = async () => {
            try {
              const result = JSON.parse(xhr.responseText)
              resolve({
                status: xhr.status,
                data: result as APIResponse<T>,
                content: result.contents as T['response'],
                errors: result.errors as APIResponse<T>['errors'],
              })
            } catch (error) {
              reject(new Error('Failed to parse response'))
            }
          }
          
          xhr.onerror = () => reject(new Error('Network error'))
          xhr.send(query)
        })
      }
      
      mergedOptions.body = query
    } else {
      mergedOptions.body = JSON.stringify(query)
    }
  }

  try {
    const response = await fetch(fullUrl, mergedOptions)
    const result = await response.json()

    return {
      status: response.status,
      data: result as APIResponse<T>,
      content: result.contents as T['response'],
      errors: result.errors as APIResponse<T>['errors'],
    }
  } catch (error) {
    console.error('Request failed:', error)
    throw error
  }
}

function getCsrfToken(): string {
  return (
    document.cookie
      .split('; ')
      .find((row) => row.startsWith('csrftoken='))
      ?.split('=')[1] || ''
  )
}

const fillURL = (url: string, params: any) => {
  let filledURL = url
  if (!params) return filledURL

  Object.entries(params).forEach(([key, value]) => {
    filledURL = filledURL.replace(`:${key}`, String(value))
  })

  return filledURL
}

export const api = {
  get: <Path extends keyof RequestEndpoints[MethodMap.GET]>({
    url,
    params,
    query,
    options,
  }: {
    url: Path
    params?: 'params' extends keyof RequestEndpoints[MethodMap.GET][Path]
      ? RequestEndpoints[MethodMap.GET][Path]['params']
      : never
    query?: 'query' extends keyof RequestEndpoints[MethodMap.GET][Path]
      ? RequestEndpoints[MethodMap.GET][Path]['query']
      : never
    options?: RequestInit
  }) => {
    return request<RequestEndpoints[MethodMap.GET][Path]>({
      method: MethodMap.GET,
      url: fillURL(url, params),
      query,
      options,
    })
  },
  post: <Path extends keyof RequestEndpoints[MethodMap.POST]>({
    url,
    params,
    query,
    options,
    onUploadProgress,
  }: {
    url: Path
    params?: 'params' extends keyof RequestEndpoints[MethodMap.POST][Path]
      ? RequestEndpoints[MethodMap.POST][Path]['params']
      : never
    query?: 'query' extends keyof RequestEndpoints[MethodMap.POST][Path]
      ? RequestEndpoints[MethodMap.POST][Path]['query']
      : never
    options?: RequestInit
    onUploadProgress?: (progressEvent: { loaded: number; total?: number }) => void
  }) => {
    return request<RequestEndpoints[MethodMap.POST][Path]>({
      method: MethodMap.POST,
      url: fillURL(url, params),
      query,
      options,
      onUploadProgress,
    })
  },
  put: <Path extends keyof RequestEndpoints[MethodMap.PUT]>({
    url,
    params,
    query,
    options,
    onUploadProgress,
  }: {
    url: Path
    params?: 'params' extends keyof RequestEndpoints[MethodMap.PUT][Path]
      ? RequestEndpoints[MethodMap.PUT][Path]['params']
      : never
    query?: 'query' extends keyof RequestEndpoints[MethodMap.PUT][Path]
      ? RequestEndpoints[MethodMap.PUT][Path]['query']
      : never
    options?: RequestInit
    onUploadProgress?: (progressEvent: { loaded: number; total?: number }) => void
  }) => {
    return request<RequestEndpoints[MethodMap.PUT][Path]>({
      method: MethodMap.PUT,
      url: fillURL(url, params),
      query,
      options,
      onUploadProgress,
    })
  },
  delete: <Path extends keyof RequestEndpoints[MethodMap.DELETE]>({
    url,
    params,
    query,
    options,
  }: {
    url: Path
    params?: 'params' extends keyof RequestEndpoints[MethodMap.DELETE][Path]
      ? RequestEndpoints[MethodMap.DELETE][Path]['params']
      : never
    query?: 'query' extends keyof RequestEndpoints[MethodMap.DELETE][Path]
      ? RequestEndpoints[MethodMap.DELETE][Path]['query']
      : never
    options?: RequestInit
  }) => {
    return request<RequestEndpoints[MethodMap.DELETE][Path]>({
      method: MethodMap.DELETE,
      url: fillURL(url, params),
      query,
      options,
    })
  },
}
