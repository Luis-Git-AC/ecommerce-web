import { Navigate, Route, Routes } from 'react-router-dom'
import HomePage from './pages/Home/HomePage'
import AboutPage from './pages/About/AboutPage'
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

function App() {
  return (
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
      <Route path="*" element={<HomePage />} />
    </Routes>
  )
}

export default App
