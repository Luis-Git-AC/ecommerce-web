const DEFAULT_API_BASE_URL = 'http://localhost:4000/api'
const DEFAULT_SITE_URL = 'http://localhost:5173'

const readString = (value: string | undefined) => {
  const normalized = value?.trim()
  return normalized && normalized.length > 0 ? normalized : undefined
}

const isLocalHostname = (hostname: string) => hostname === 'localhost' || hostname === '127.0.0.1'

const assertUrl = (value: string, variableName: string) => {
  try {
    const url = new URL(value)

    if (mode === 'production') {
      if (url.protocol !== 'https:') {
        throw new Error(`${variableName} must use https in production.`)
      }

      if (isLocalHostname(url.hostname)) {
        throw new Error(`${variableName} cannot point to localhost in production.`)
      }
    }

    return value
  } catch (error) {
    if (error instanceof Error && error.message.trim()) {
      throw error
    }

    throw new Error(`Invalid ${variableName}. Expected an absolute URL.`)
  }
}

const mode = import.meta.env.PROD ? 'production' : import.meta.env.DEV ? 'development' : 'test'
const rawApiBaseUrl = readString(import.meta.env.VITE_API_BASE_URL)
const rawStripePublishableKey = readString(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)
const rawSiteUrl = readString(import.meta.env.VITE_SITE_URL)
const rawOgImageUrl = readString(import.meta.env.VITE_OG_IMAGE_URL)

if (mode === 'production' && !rawApiBaseUrl) {
  throw new Error('Missing VITE_API_BASE_URL in production.')
}

if (mode === 'production' && !rawStripePublishableKey) {
  throw new Error('Missing VITE_STRIPE_PUBLISHABLE_KEY in production.')
}

if (mode === 'production' && !rawSiteUrl) {
  throw new Error('Missing VITE_SITE_URL in production.')
}

if (mode === 'production' && rawStripePublishableKey && !rawStripePublishableKey.startsWith('pk_')) {
  throw new Error('Invalid VITE_STRIPE_PUBLISHABLE_KEY in production.')
}

export const appEnv = {
  mode,
  apiBaseUrl: assertUrl(rawApiBaseUrl ?? DEFAULT_API_BASE_URL, 'VITE_API_BASE_URL'),
  stripePublishableKey: rawStripePublishableKey ?? '',
  siteUrl: assertUrl(rawSiteUrl ?? DEFAULT_SITE_URL, 'VITE_SITE_URL'),
  ogImageUrl: rawOgImageUrl ? assertUrl(rawOgImageUrl, 'VITE_OG_IMAGE_URL') : '',
}