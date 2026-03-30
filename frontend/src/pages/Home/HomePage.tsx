import Footer from '../../components/layout/Footer'
import Header from '../../components/layout/Header'
import HeroSection from '../../components/sections/HeroSection'
import OurProcessSection from '../../components/sections/OurProcessSection'
import ProductGridSection from '../../components/sections/ProductGridSection'
import QuizSection from '../../components/sections/QuizSection'
import SubscriptionPlansSection from '../../components/sections/SubscriptionPlansSection'
import TestimonialsSection from '../../components/sections/TestimonialsSection'
import styles from './HomePage.module.css'

export default function HomePage() {
  return (
    <div className={`page brand-page ${styles.home}`}>
      <Header />
      <main>
        <HeroSection />
        <ProductGridSection />
        <OurProcessSection />
        <QuizSection />
        <SubscriptionPlansSection />
        <TestimonialsSection />
      </main>
      <Footer />
    </div>
  )
}
