import { useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useLocation } from 'react-router-dom'
import { applySeo, seoDefaults } from './utils/seo'
import HomePage from './pages/Home/HomePage'
import AboutPage from './pages/About/AboutPage'
import AccountPage from './pages/Account/AccountPage'
import ClubPage from './pages/Club/ClubPage'
import BlogPage from './pages/Blog/BlogPage'
import BlogPostPage from './pages/Blog/BlogPostPage'
import ContactPage from './pages/Contact/ContactPage'
import HelpPage from './pages/Help/HelpPage'
import CookiesPage from './pages/Legal/CookiesPage'
import PrivacyPage from './pages/Legal/PrivacyPage'
import TermsPage from './pages/Legal/TermsPage'
import ProductPage from './pages/Product/ProductPage'
import ShopPage from './pages/Shop/ShopPage'
import ShippingPage from './pages/Shipping/ShippingPage'
import CartPage from './pages/Cart/CartPage'
import OrderDetailPage from './pages/Order/OrderDetailPage'
import CheckoutPage from './pages/Checkout/CheckoutPage'
import AdminPage from './pages/Admin/AdminPage'

function App() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (hash) {
      const id = hash.replace('#', '')
      const target = document.getElementById(id)
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' })
        return
      }
    }

    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [pathname, hash])

  useEffect(() => {
    const routeSeo = (() => {
      if (pathname === '/') {
        return {
          title: seoDefaults.defaultTitle,
          description: seoDefaults.defaultDescription,
          path: '/',
        }
      }

      if (pathname === '/shop') {
        return {
          title: 'Tienda de plantas | Ecommerce Web',
          description: 'Explora el catálogo de plantas con detalle de producto, carrito persistente y compra online.',
          path: pathname,
        }
      }

      if (pathname.startsWith('/product/')) {
        return {
          title: 'Detalle de producto | Ecommerce Web',
          description: 'Consulta imágenes, características y cuidados antes de añadir una planta al carrito.',
          path: pathname,
        }
      }

      if (pathname === '/blog') {
        return {
          title: 'Blog de cuidados y consejos | Ecommerce Web',
          description: 'Guías prácticas para cuidar plantas, resolver problemas comunes y mejorar tus espacios verdes.',
          path: pathname,
        }
      }

      if (pathname.startsWith('/blog/')) {
        return {
          title: 'Guía del blog | Ecommerce Web',
          description: 'Artículo de blog sobre cuidados, diseño y problemas comunes en plantas de interior.',
          path: pathname,
          type: 'article' as const,
        }
      }

      if (pathname === '/about') {
        return {
          title: 'Sobre Ecommerce Web',
          description: 'Conoce el enfoque detrás del proyecto y la propuesta de valor de esta tienda de plantas.',
          path: pathname,
        }
      }

      if (pathname === '/contact') {
        return {
          title: 'Contacto | Ecommerce Web',
          description: 'Contacta con el equipo para resolver dudas sobre pedidos, cuidados o recomendaciones.',
          path: pathname,
        }
      }

      if (pathname === '/shipping') {
        return {
          title: 'Envíos | Ecommerce Web',
          description: 'Consulta la política y condiciones de envío de la tienda.',
          path: pathname,
        }
      }

      if (pathname === '/help') {
        return {
          title: 'Ayuda | Ecommerce Web',
          description: 'Centro de ayuda con respuestas rápidas sobre la experiencia de compra.',
          path: pathname,
        }
      }

      if (pathname === '/club') {
        return {
          title: 'Club de plantas | Ecommerce Web',
          description: 'Explora los planes del club y deja tus datos si te interesa recibir contenido y ventajas.',
          path: pathname,
        }
      }

      if (pathname.startsWith('/legal/')) {
        return {
          title: 'Información legal | Ecommerce Web',
          description: 'Documentación legal y de privacidad del proyecto.',
          path: pathname,
        }
      }

      if (pathname === '/account' || pathname === '/cart' || pathname.startsWith('/checkout/') || pathname.startsWith('/account/orders/') || pathname === '/admin') {
        return {
          title: 'Área privada | Ecommerce Web',
          description: 'Zona de usuario y flujo transaccional del ecommerce.',
          path: pathname,
          robots: 'noindex, nofollow',
        }
      }

      return {
        title: seoDefaults.defaultTitle,
        description: seoDefaults.defaultDescription,
        path: pathname,
      }
    })()

    applySeo(routeSeo)
  }, [pathname])

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/shop" element={<ShopPage />} />
      <Route path="/account" element={<AccountPage />} />
      <Route path="/account/orders/:id" element={<OrderDetailPage />} />
      <Route path="/checkout/:orderId" element={<CheckoutPage />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/cart" element={<CartPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/club" element={<ClubPage />} />
      <Route path="/blog" element={<BlogPage />} />
      <Route path="/blog/:slug" element={<BlogPostPage />} />
      <Route path="/help" element={<HelpPage />} />
      <Route path="/shipping" element={<ShippingPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/legal/privacy" element={<PrivacyPage />} />
      <Route path="/legal/terms" element={<TermsPage />} />
      <Route path="/legal/cookies" element={<CookiesPage />} />
      <Route path="/product" element={<Navigate to="/shop" replace />} />
      <Route path="/product/:id" element={<ProductPage />} />
      <Route path="*" element={<HomePage />} />
    </Routes>
  )
}

export default App
