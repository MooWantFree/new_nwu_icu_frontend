import { ErrorFactory } from './errors'

export enum MethodMap {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
}

export type APIBase = {
  endpoint: string
  method: MethodMap
  params?: Record<string, string | number | boolean> // The slot in enpoint
  query?: Record<string, string | number | boolean | null> | FormData // The GET Query or POST/DELETE/PUT data
  response: any
  message?: string
  errors?: ErrorFactory<string>[]
}
