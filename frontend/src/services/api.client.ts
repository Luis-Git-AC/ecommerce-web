import { appEnv } from '../config/env'

const API_BASE_URL = appEnv.apiBaseUrl

export class ApiClientError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiClientError'
    this.status = status
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  body?: unknown
  accessToken?: string
}

const parseErrorMessage = async (response: Response) => {
  try {
    const data = (await response.json()) as { message?: unknown }
    if (typeof data.message === 'string' && data.message.trim()) {
      return data.message
    }
  } catch {
    // Si no hay JSON valido, usamos fallback textual.
  }

  return `Request failed: ${response.status} ${response.statusText}`
}

export const apiRequest = async <T>(path: string, options: RequestOptions = {}): Promise<T> => {
  const headers = new Headers()

  if (options.body !== undefined) {
    headers.set('Content-Type', 'application/json')
  }

  if (options.accessToken) {
    headers.set('Authorization', `Bearer ${options.accessToken}`)
  }

  let response: Response

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method ?? 'GET',
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    })
  } catch {
    throw new ApiClientError(0, 'No pudimos conectarnos en este momento. Intenta de nuevo.')
  }

  if (!response.ok) {
    const message = await parseErrorMessage(response)
    throw new ApiClientError(response.status, message)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}
