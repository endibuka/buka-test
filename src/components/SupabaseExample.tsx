'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function SupabaseExample() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  const testSupabaseConnection = async () => {
    setLoading(true)
    try {
      // Test the connection by getting the current user (will be null if not authenticated)
      const { data, error } = await supabase.auth.getUser()
      
      if (error) {
        setResult(`Error: ${error.message}`)
      } else {
        setResult('Supabase connection successful! User: ' + (data.user ? data.user.email : 'Not authenticated'))
      }
    } catch (err) {
      setResult(`Connection failed: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-gray-900">Supabase Integration Test</h2>
      <p className="text-gray-600 mb-4">
        This component demonstrates the Supabase connection. Make sure to set up your environment variables.
      </p>
      
      <div className="space-y-4">
        <button
          onClick={testSupabaseConnection}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
        >
          {loading ? 'Testing...' : 'Test Supabase Connection'}
        </button>
        
        {result && (
          <div className="mt-4 p-4 bg-gray-100 rounded-md">
            <p className="text-sm font-medium text-gray-900">Result:</p>
            <p className="text-sm text-gray-700 mt-1">{result}</p>
          </div>
        )}
        
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <h3 className="text-sm font-medium text-yellow-800 mb-2">Setup Instructions:</h3>
          <ol className="text-sm text-yellow-700 space-y-1 list-decimal list-inside">
            <li>Copy <code className="bg-yellow-100 px-1 rounded">env.example</code> to <code className="bg-yellow-100 px-1 rounded">.env.local</code></li>
            <li>Add your Supabase project URL and anon key</li>
            <li>Restart the development server</li>
          </ol>
        </div>
      </div>
    </div>
  )
} 