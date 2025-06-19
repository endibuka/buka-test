import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function About() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">About Buka Test</h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-600 mb-6">
              Buka Test is a modern web application built with cutting-edge technologies to provide
              a robust foundation for your next project.
            </p>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Technology Stack</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Frontend</h3>
                <ul className="text-gray-600 space-y-1">
                  <li>• Next.js 15 with App Router</li>
                  <li>• TypeScript for type safety</li>
                  <li>• Tailwind CSS for styling</li>
                  <li>• React 18 with hooks</li>
                </ul>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Backend</h3>
                <ul className="text-gray-600 space-y-1">
                  <li>• Supabase for database</li>
                  <li>• Real-time subscriptions</li>
                  <li>• Authentication</li>
                  <li>• File storage</li>
                </ul>
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Features</h2>
            <ul className="text-gray-600 space-y-2 mb-6">
              <li>• Server-side rendering with Next.js</li>
              <li>• Type-safe development with TypeScript</li>
              <li>• Responsive design with Tailwind CSS</li>
              <li>• Database integration with Supabase</li>
              <li>• Modern development workflow</li>
              <li>• SEO optimized</li>
            </ul>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Getting Started</h3>
              <p className="text-blue-800 text-sm">
                This template is ready to use! Simply configure your Supabase credentials and start building
                your application. The project structure is organized for scalability and maintainability.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
} 