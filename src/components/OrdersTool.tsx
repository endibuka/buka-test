'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { fetchOrdersCSV, OrderData } from '@/lib/api'

export default function OrdersTool() {
  const [orders, setOrders] = useState<OrderData[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)
  
  // Data limiter states
  const [dataRange, setDataRange] = useState<'all' | 'custom'>('all')
  const [startRow, setStartRow] = useState(1)
  const [endRow, setEndRow] = useState(50)

  const handleFetchOrders = async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)
    
    try {
      const data = await fetchOrdersCSV()
      setOrders(data)
      setSuccess(`Successfully fetched ${data.length} orders`)
      
      // Auto-set end row to min of 50 or total data length
      setEndRow(Math.min(50, data.length))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch orders')
    } finally {
      setLoading(false)
    }
  }

  const handleUploadToSupabase = async () => {
    if (orders.length === 0) {
      setError('No orders to upload. Please fetch orders first.')
      return
    }

    setUploading(true)
    setError(null)
    setSuccess(null)

    try {
      // Determine which data to upload based on range selection
      let ordersToUpload: OrderData[]
      
      if (dataRange === 'all') {
        ordersToUpload = orders
      } else {
        // Custom range (1-based indexing for user, 0-based for array)
        const startIndex = Math.max(0, startRow - 1)
        const endIndex = Math.min(orders.length, endRow)
        
        if (startIndex >= endIndex) {
          throw new Error('Start row must be less than end row')
        }
        
        ordersToUpload = orders.slice(startIndex, endIndex)
      }

      // Prepare data for insertion
      const ordersToInsert = ordersToUpload.map(order => ({
        order_id: order.OrderID,
        item_quantity: parseInt(order['Item Quantity']) || 0,
        variation_number: order['Variation Number'],
        order_date: order['Order Date'],
        variation_name: order['Variation Name'],
        attribute: order.Attribute,
        marketplace: order.Marketplace,
        delivery_country: order['Delivery Country'],
        created_at: new Date().toISOString()
      }))

      // Insert data in batches of 100
      const batchSize = 100
      let insertedCount = 0

      for (let i = 0; i < ordersToInsert.length; i += batchSize) {
        const batch = ordersToInsert.slice(i, i + batchSize)
        const { error: insertError } = await supabase
          .from('orders')
          .insert(batch)

        if (insertError) {
          // If table doesn't exist, provide helpful error message
          if (insertError.message.includes('relation "orders" does not exist')) {
            throw new Error('Orders table does not exist. Please run the SQL schema in your Supabase SQL editor first. Check the supabase-schema.sql file.')
          }
          throw new Error(`Failed to insert batch ${Math.floor(i / batchSize) + 1}: ${insertError.message}`)
        }

        insertedCount += batch.length
      }

      setSuccess(`Successfully uploaded ${insertedCount} orders to Supabase (${dataRange === 'all' ? 'all data' : `rows ${startRow}-${endRow}`})`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload orders')
    } finally {
      setUploading(false)
    }
  }

  const displayedOrders = showAll ? orders : orders.slice(0, 50)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow-lg p-6" style={{ backgroundColor: 'var(--card)' }}>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">Orders Management Tool</h1>
        
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 mb-6">
          <button
            onClick={handleFetchOrders}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            {loading ? 'Fetching...' : 'Fetch Orders CSV'}
          </button>
          
          <button
            onClick={handleUploadToSupabase}
            disabled={uploading || orders.length === 0}
            className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            {uploading ? 'Uploading...' : 'Upload to Supabase'}
          </button>
        </div>

        {/* Data Range Selector */}
        {orders.length > 0 && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg" style={{ backgroundColor: 'var(--muted)' }}>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">Data Upload Range</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="all"
                    checked={dataRange === 'all'}
                    onChange={(e) => setDataRange(e.target.value as 'all' | 'custom')}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Upload All Data ({orders.length} rows)</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="custom"
                    checked={dataRange === 'custom'}
                    onChange={(e) => setDataRange(e.target.value as 'all' | 'custom')}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Custom Range</span>
                </label>
              </div>
              
              {dataRange === 'custom' && (
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">From Row:</label>
                    <input
                      type="number"
                      min="1"
                      max={orders.length}
                      value={startRow}
                      onChange={(e) => setStartRow(parseInt(e.target.value) || 1)}
                      className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">To Row:</label>
                    <input
                      type="number"
                      min={startRow}
                      max={orders.length}
                      value={endRow}
                      onChange={(e) => setEndRow(parseInt(e.target.value) || startRow)}
                      className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    ({dataRange === 'custom' ? Math.max(0, endRow - startRow + 1) : orders.length} rows will be uploaded)
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Status Messages */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
            <p className="text-green-800 text-sm">{success}</p>
          </div>
        )}

        {/* Orders Table */}
        {orders.length > 0 && (
          <div className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Orders Data ({orders.length} total)
              </h2>
              {orders.length > 50 && (
                <button
                  onClick={() => setShowAll(!showAll)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  {showAll ? 'Show First 50' : 'Show All'}
                </button>
              )}
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Row #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Order ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Variation #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Order Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Variation Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Attribute
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Marketplace
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Delivery Country
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-600">
                  {displayedOrders.map((order, index) => (
                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                        {order.OrderID}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {order['Item Quantity']}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {order['Variation Number']}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {order['Order Date']}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                        {order['Variation Name']}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                        {order.Attribute}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {order.Marketplace}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {order['Delivery Country']}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {orders.length > 50 && (
              <div className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
                Showing {displayedOrders.length} of {orders.length} orders
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        {orders.length === 0 && (
          <div className="mt-8 p-6 bg-gray-50 rounded-lg" style={{ backgroundColor: 'var(--muted)' }}>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Getting Started</h3>
            <ol className="text-sm text-gray-600 dark:text-gray-300 space-y-1 list-decimal list-inside">
              <li>Click &quot;Fetch Orders CSV&quot; to download and parse the latest orders data</li>
              <li>Review the data in the table below (shows first 50 rows by default)</li>
              <li>Choose your upload range (all data or custom range)</li>
              <li>Click &quot;Upload to Supabase&quot; to store the data in your database</li>
            </ol>
            <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
              <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                <strong>Note:</strong> Before uploading to Supabase, make sure to run the SQL schema in your Supabase SQL editor. 
                The schema file is located at <code className="bg-yellow-100 dark:bg-yellow-800 px-1 rounded">src/lib/supabase-schema.sql</code>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 