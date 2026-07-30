import { Suspense, lazy, useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import AdminRoute from '@/components/routing/AdminRoute'
import ProtectedRoute from '@/components/routing/ProtectedRoute'
import RouteFallback from '@/components/common/RouteFallback'
import { applySeo } from '@/utils/seo'
import { getRouteSeo } from '@/utils/seo.config'
import { getScrollBehavior } from '@/utils/motion'

import HomePage from '@/pages/Home/HomePage'

const AboutPage = lazy(() => import('@/pages/About/AboutPage'))
const AccountPage = lazy(() => import('@/pages/Account/AccountPage'))
const AdminPage = lazy(() => import('@/pages/Admin/AdminPage'))
const BlogPage = lazy(() => import('@/pages/Blog/BlogPage'))
const BlogPostPage = lazy(() => import('@/pages/Blog/BlogPostPage'))
const CartPage = lazy(() => import('@/pages/Cart/CartPage'))
const CheckoutPage = lazy(() => import('@/pages/Checkout/CheckoutPage'))
const ClubPage = lazy(() => import('@/pages/Club/ClubPage'))
const ContactPage = lazy(() => import('@/pages/Contact/ContactPage'))
const CookiesPage = lazy(() => import('@/pages/Legal/CookiesPage'))
const HelpPage = lazy(() => import('@/pages/Help/HelpPage'))
const NotFoundPage = lazy(() => import('@/pages/NotFound/NotFoundPage'))
const OrderDetailPage = lazy(() => import('@/pages/Order/OrderDetailPage'))
const PrivacyPage = lazy(() => import('@/pages/Legal/PrivacyPage'))
const ProductPage = lazy(() => import('@/pages/Product/ProductPage'))
const ShippingPage = lazy(() => import('@/pages/Shipping/ShippingPage'))
const ShopPage = lazy(() => import('@/pages/Shop/ShopPage'))
const TermsPage = lazy(() => import('@/pages/Legal/TermsPage'))

function App() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    const behavior = getScrollBehavior()

    if (hash) {
      const target = document.getElementById(hash.replace('#', ''))
      if (target) {
        target.scrollIntoView({ behavior, block: 'start' })
        return
      }
    }

    window.scrollTo({ top: 0, behavior })
  }, [pathname, hash])

  useEffect(() => {
    applySeo(getRouteSeo(pathname))
  }, [pathname])

  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/shop" element={<ShopPage />} />
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

        <Route path="/account" element={<AccountPage />} />
        <Route
          path="/account/orders/:id"
          element={
            <ProtectedRoute>
              <OrderDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cart"
          element={
            <ProtectedRoute>
              <CartPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/checkout/:orderId"
          element={
            <ProtectedRoute>
              <CheckoutPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminPage />
            </AdminRoute>
          }
        />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  )
}

export default App
