import { APIResponse, ResponseBase } from "@/types/api"

type RequestConfig = {
  method: "GET" | "POST" | "PUT" | "DELETE"
  url: string
  data?: any
}

async function request<T extends ResponseBase>(config: RequestConfig): Promise<{ status: number, data: APIResponse<T>, content: T["success"], errors?: APIResponse<T>["errors"] }> {
  const { method, url, data } = config
  const fullUrl = `${url}`

  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': getCsrfToken()
    },
    credentials: 'include'
  }

  if (data) {
    options.body = JSON.stringify(data)
  }

  try {
    const response = await fetch(fullUrl, options)
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
  get: <T extends ResponseBase>(url: string) => request<T>({ method: 'GET', url }),
  post: <T extends ResponseBase>(url: string, data: any) => request<T>({ method: 'POST', url, data }),
  put: <T extends ResponseBase>(url: string, data: any) => request<T>({ method: 'PUT', url, data }),
  delete: <T extends ResponseBase>(url: string) => request<T>({ method: 'DELETE', url })
}

