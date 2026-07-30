import { appEnv } from '@/config/env'
import type { Product } from '@/types/product'

const SCRIPT_ID = 'structured-data'
const SITE_NAME = 'Ecommerce Web'

const absoluteUrl = (path = '/') => new URL(path, appEnv.siteUrl).toString()

type JsonLdNode = Record<string, unknown>

export const applyJsonLd = (nodes: JsonLdNode[]) => {
  let element = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null

  if (nodes.length === 0) {
    element?.remove()
    return
  }

  if (!element) {
    element = document.createElement('script')
    element.id = SCRIPT_ID
    element.type = 'application/ld+json'
    document.head.appendChild(element)
  }

  element.textContent = JSON.stringify(nodes.length === 1 ? nodes[0] : nodes)
}

export const organizationJsonLd = (): JsonLdNode => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: SITE_NAME,
  url: absoluteUrl('/'),
  logo: appEnv.ogImageUrl || absoluteUrl('/favicon.svg'),
  description:
    'Tienda de plantas online con catálogo dinámico, carrito persistente y pago seguro con Stripe.',
})

export const webSiteJsonLd = (): JsonLdNode => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE_NAME,
  url: absoluteUrl('/'),
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${absoluteUrl('/shop')}?q={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
})

export const productJsonLd = (product: Product): JsonLdNode => ({
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: product.name,
  description: product.description,
  sku: product.slug,
  image: [product.images.card.src, ...product.images.gallery.map((image) => image.src)].filter(
    Boolean,
  ),
  category: product.category,
  url: absoluteUrl(`/product/${product.slug}`),
  offers: {
    '@type': 'Offer',
    price: product.price,
    priceCurrency: product.currency,
    availability:
      product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    url: absoluteUrl(`/product/${product.slug}`),
  },
})

export const breadcrumbJsonLd = (items: Array<{ name: string; path: string }>): JsonLdNode => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: absoluteUrl(item.path),
  })),
})

export const articleJsonLd = (article: {
  title: string
  description: string
  slug: string
  publishedAt?: string
  image?: string
}): JsonLdNode => ({
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: article.title,
  description: article.description,
  url: absoluteUrl(`/blog/${article.slug}`),
  datePublished: article.publishedAt,
  image: article.image ? [article.image] : undefined,
  publisher: {
    '@type': 'Organization',
    name: SITE_NAME,
  },
})
