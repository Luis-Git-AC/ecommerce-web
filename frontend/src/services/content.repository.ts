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

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() || 'http://localhost:4000/api'

const getJson = async <T>(path: string): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${path}`)
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText}`)
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
    throw new Error(`Request failed: ${response.status} ${response.statusText}`)
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
