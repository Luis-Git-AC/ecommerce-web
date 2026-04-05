import { appEnv } from '../config/env'

export type BlogPost = {
  _id: string
  slug: string
  title: string
  category: string
  excerpt: string
  content: string
  image: string
  publishedAt: string
}

type BlogListResponse = {
  data: {
    items: BlogPost[]
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

type BlogDetailResponse = {
  data: BlogPost
}

type GenericCreateResponse = {
  data: {
    id: string
  }
}

const API_BASE_URL = appEnv.apiBaseUrl

const friendlyStatusMessage = (status: number) => {
  if (status === 400) return 'Los datos enviados no son validos. Revisa el formulario e intenta de nuevo.'
  if (status === 404) return 'No encontramos el recurso solicitado.'
  if (status === 409) return 'Este registro ya existe.'
  if (status === 429) return 'Has realizado demasiados intentos. Espera unos minutos y vuelve a intentar.'
  if (status >= 500) return 'Tuvimos un problema temporal. Intenta nuevamente en unos minutos.'
  return 'No pudimos completar la solicitud en este momento.'
}

const parseErrorMessage = async (response: Response) => {
  try {
    const body = (await response.json()) as { message?: unknown }
    if (typeof body.message === 'string' && body.message.trim()) {
      return body.message.trim()
    }
  } catch {
    // No-op: si la respuesta no es JSON util, usamos un mensaje amigable.
  }

  return friendlyStatusMessage(response.status)
}

const getJson = async <T>(path: string): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${path}`)
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response))
  }

  return (await response.json()) as T
}

const postJson = async <T>(path: string, body: Record<string, unknown>): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response))
  }

  return (await response.json()) as T
}

export const contentRepository = {
  async listBlog() {
    const response = await getJson<BlogListResponse>('/blog')
    return response.data.items
  },
  async getBlogBySlug(slug: string) {
    const response = await getJson<BlogDetailResponse>(`/blog/${slug}`)
    return response.data
  },
  async createContactMessage(payload: { name: string; email: string; message: string }) {
    return postJson<GenericCreateResponse>('/contact/messages', payload)
  },
  async subscribeNewsletter(payload: { email: string }) {
    return postJson<GenericCreateResponse>('/newsletter/subscribe', payload)
  },
  async createClubLead(payload: { name: string; email: string; plan: 'basic' | 'medio' | 'premium' }) {
    return postJson<GenericCreateResponse>('/club/leads', payload)
  },
}
