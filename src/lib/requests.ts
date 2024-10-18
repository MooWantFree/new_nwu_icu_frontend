import { ResponseBase, APIResponse } from '@/types/api'

type RequestConfig = {
  method: "GET" | "POST" | "PUT" | "DELETE"
  url: string
  data?: any
  options?: RequestInit
}

async function request<T extends ResponseBase>(config: RequestConfig): Promise<{ status: number, data: APIResponse<T>, content: T["success"], errors?: APIResponse<T>["errors"] }> {
  const { method, url, data, options: customOptions } = config
  const fullUrl = `${url}`

  const defaultOptions: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': getCsrfToken()
    },
    credentials: 'include'
  }

  const mergedOptions: RequestInit = {
    ...defaultOptions,
    ...customOptions,
    headers: {
      ...defaultOptions.headers,
      ...customOptions?.headers
    }
  }

  if (data) {
    if (data instanceof FormData || data instanceof File) {
      delete mergedOptions.headers['Content-Type']
      mergedOptions.body = data
    } else {
      mergedOptions.body = JSON.stringify(data)
    }
  }

  try {
    const response = await fetch(fullUrl, mergedOptions)
    const result = await response.json()

    return { status: response.status, data: result as APIResponse<T>, content: result.contents as T["success"], errors: result.errors as APIResponse<T>["errors"] }
  } catch (error) {
    console.error('Request failed:', error)
    throw error
  }
}

function getCsrfToken(): string {
  return document.cookie.split('; ').find(row => row.startsWith('csrftoken='))?.split('=')[1] || ''
}

export const api = {
  get: <T extends ResponseBase>(url: string, options?: RequestInit) => request<T>({ method: 'GET', url, options }),
  post: <T extends ResponseBase>(url: string, data: any, options?: RequestInit) => request<T>({ method: 'POST', url, data, options }),
  put: <T extends ResponseBase>(url: string, data: any, options?: RequestInit) => request<T>({ method: 'PUT', url, data, options }),
  delete: <T extends ResponseBase>(url: string, options?: RequestInit) => request<T>({ method: 'DELETE', url, options })
}

