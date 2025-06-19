import OrdersTool from '@/components/OrdersTool'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="flex-1">
        <OrdersTool />
      </main>
      <Footer />
    </div>
  )
}
