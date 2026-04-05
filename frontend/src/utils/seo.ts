import { appEnv } from '../config/env'

type SeoConfig = {
  title: string
  description: string
  path?: string
  robots?: string
  image?: string
  type?: 'website' | 'article'
}

const DEFAULT_DESCRIPTION =
  'Tienda de plantas online con catálogo dinámico, carrito persistente, autenticación y checkout seguro con Stripe en modo test.'

const DEFAULT_TITLE = 'Ecommerce Web – Tienda de Plantas'

const buildUrl = (path = '/') => new URL(path, appEnv.siteUrl).toString()

const getDefaultImage = () => appEnv.ogImageUrl || buildUrl('/vite.svg')

const upsertMetaByName = (name: string, content: string) => {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`)

  if (!element) {
    element = document.createElement('meta')
    element.setAttribute('name', name)
    document.head.appendChild(element)
  }

  element.setAttribute('content', content)
}

const upsertMetaByProperty = (property: string, content: string) => {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[property="${property}"]`)

  if (!element) {
    element = document.createElement('meta')
    element.setAttribute('property', property)
    document.head.appendChild(element)
  }

  element.setAttribute('content', content)
}

const upsertCanonical = (href: string) => {
  let element = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')

  if (!element) {
    element = document.createElement('link')
    element.setAttribute('rel', 'canonical')
    document.head.appendChild(element)
  }

  element.setAttribute('href', href)
}

export const applySeo = ({ title, description, path = '/', robots = 'index, follow', image, type = 'website' }: SeoConfig) => {
  const normalizedTitle = title.trim() || DEFAULT_TITLE
  const normalizedDescription = description.trim() || DEFAULT_DESCRIPTION
  const canonicalUrl = buildUrl(path)
  const imageUrl = image?.trim() ? image : getDefaultImage()

  document.title = normalizedTitle
  upsertMetaByName('description', normalizedDescription)
  upsertMetaByName('robots', robots)
  upsertMetaByProperty('og:title', normalizedTitle)
  upsertMetaByProperty('og:description', normalizedDescription)
  upsertMetaByProperty('og:type', type)
  upsertMetaByProperty('og:url', canonicalUrl)
  upsertMetaByProperty('og:image', imageUrl)
  upsertMetaByName('twitter:card', 'summary_large_image')
  upsertMetaByName('twitter:title', normalizedTitle)
  upsertMetaByName('twitter:description', normalizedDescription)
  upsertMetaByName('twitter:image', imageUrl)
  upsertCanonical(canonicalUrl)
}

export const seoDefaults = {
  defaultTitle: DEFAULT_TITLE,
  defaultDescription: DEFAULT_DESCRIPTION,
}