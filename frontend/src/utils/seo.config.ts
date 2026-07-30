import { seoDefaults } from './seo'

export type RouteSeo = {
  title: string
  description: string
  path: string
  robots?: string
  type?: 'website' | 'article'
}

type SeoRule = {
  exact?: string
  prefix?: string
  seo: Omit<RouteSeo, 'path'>
}

const PRIVATE_SEO: Omit<RouteSeo, 'path'> = {
  title: 'Área privada | Ecommerce Web',
  description: 'Zona de usuario y flujo transaccional del ecommerce.',
  robots: 'noindex, nofollow',
}

const SEO_RULES: SeoRule[] = [
  {
    exact: '/',
    seo: { title: seoDefaults.defaultTitle, description: seoDefaults.defaultDescription },
  },
  {
    exact: '/shop',
    seo: {
      title: 'Tienda de plantas | Ecommerce Web',
      description:
        'Explora el catálogo de plantas con detalle de producto, carrito persistente y compra online.',
    },
  },
  {
    prefix: '/product/',
    seo: {
      title: 'Detalle de producto | Ecommerce Web',
      description:
        'Consulta imágenes, características y cuidados antes de añadir una planta al carrito.',
    },
  },
  {
    exact: '/blog',
    seo: {
      title: 'Blog de cuidados y consejos | Ecommerce Web',
      description:
        'Guías prácticas para cuidar plantas, resolver problemas comunes y mejorar tus espacios verdes.',
    },
  },
  {
    prefix: '/blog/',
    seo: {
      title: 'Guía del blog | Ecommerce Web',
      description:
        'Artículo de blog sobre cuidados, diseño y problemas comunes en plantas de interior.',
      type: 'article',
    },
  },
  {
    exact: '/about',
    seo: {
      title: 'Sobre Ecommerce Web',
      description:
        'Conoce el enfoque detrás del proyecto y la propuesta de valor de esta tienda de plantas.',
    },
  },
  {
    exact: '/contact',
    seo: {
      title: 'Contacto | Ecommerce Web',
      description:
        'Contacta con el equipo para resolver dudas sobre pedidos, cuidados o recomendaciones.',
    },
  },
  {
    exact: '/shipping',
    seo: {
      title: 'Envíos | Ecommerce Web',
      description: 'Consulta la política y condiciones de envío de la tienda.',
    },
  },
  {
    exact: '/help',
    seo: {
      title: 'Ayuda | Ecommerce Web',
      description: 'Centro de ayuda con respuestas rápidas sobre la experiencia de compra.',
    },
  },
  {
    exact: '/club',
    seo: {
      title: 'Club de plantas | Ecommerce Web',
      description:
        'Explora los planes del club y deja tus datos si te interesa recibir contenido y ventajas.',
    },
  },
  {
    prefix: '/legal/',
    seo: {
      title: 'Información legal | Ecommerce Web',
      description: 'Documentación legal y de privacidad del proyecto.',
    },
  },
  { exact: '/account', seo: PRIVATE_SEO },
  { prefix: '/account/orders/', seo: PRIVATE_SEO },
  { exact: '/cart', seo: PRIVATE_SEO },
  { prefix: '/checkout/', seo: PRIVATE_SEO },
  { exact: '/admin', seo: PRIVATE_SEO },
]

const NOT_FOUND_SEO: Omit<RouteSeo, 'path'> = {
  title: 'Página no encontrada | Ecommerce Web',
  description: 'La página que buscas no existe o ha cambiado de dirección.',
  robots: 'noindex, follow',
}

export const getRouteSeo = (pathname: string): RouteSeo => {
  for (const rule of SEO_RULES) {
    if (rule.exact !== undefined && pathname === rule.exact) {
      return { ...rule.seo, path: pathname }
    }

    if (rule.prefix !== undefined && pathname.startsWith(rule.prefix)) {
      return { ...rule.seo, path: pathname }
    }
  }

  return { ...NOT_FOUND_SEO, path: pathname }
}
