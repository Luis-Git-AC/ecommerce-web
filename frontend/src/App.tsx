import HomePage from './pages/Home/HomePage'
import ClubPage from './pages/Club/ClubPage'
import BlogPage from './pages/Blog/BlogPage'
import ProductPage from './pages/Product/ProductPage'
import ShopPage from './pages/Shop/ShopPage'

function App() {
  if (window.location.pathname === '/shop') {
    return <ShopPage />
  }

  if (window.location.pathname === '/club') {
    return <ClubPage />
  }

  if (window.location.pathname === '/blog') {
    return <BlogPage />
  }

  if (window.location.pathname === '/product') {
    return <ProductPage />
  }

  return <HomePage />
}

export default App
