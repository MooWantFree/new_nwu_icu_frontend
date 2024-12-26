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
}: {
  method: MethodMap
  url: string
  query?: T['query']
  options?: RequestInit
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
    const filledUrl = fillURL(url, params)
    return request<RequestEndpoints[MethodMap.GET][Path]>({
      method: MethodMap.GET,
      url: filledUrl,
      query,
      options,
    })
  },
  post: <Path extends keyof RequestEndpoints[MethodMap.POST]>({
    url,
    params,
    query,
    options,
  }: {
    url: Path
    params?: 'params' extends keyof RequestEndpoints[MethodMap.POST][Path]
      ? RequestEndpoints[MethodMap.POST][Path]['params']
      : never
    query?: 'query' extends keyof RequestEndpoints[MethodMap.POST][Path]
      ? RequestEndpoints[MethodMap.POST][Path]['query']
      : never
    options?: RequestInit
  }) => {
    const filledUrl = fillURL(url, params)
    return request<RequestEndpoints[MethodMap.POST][Path]>({
      method: MethodMap.POST,
      url: filledUrl,
      query,
      options,
    })
  },
  put: <Path extends keyof RequestEndpoints[MethodMap.PUT]>({
    url,
    params,
    query,
    options,
  }: {
    url: Path
    params?: 'params' extends keyof RequestEndpoints[MethodMap.PUT][Path]
      ? RequestEndpoints[MethodMap.PUT][Path]['params']
      : never
    query?: 'query' extends keyof RequestEndpoints[MethodMap.PUT][Path]
      ? RequestEndpoints[MethodMap.PUT][Path]['query']
      : never
    options?: RequestInit
  }) => {
    const filledUrl = fillURL(url, params)
    return request<RequestEndpoints[MethodMap.PUT][Path]>({
      method: MethodMap.PUT,
      url: filledUrl,
      query,
      options,
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
    const filledUrl = fillURL(url, params)
    return request<RequestEndpoints[MethodMap.DELETE][Path]>({
      method: MethodMap.DELETE,
      url: filledUrl,
      query,
      options,
    })
  },
}
