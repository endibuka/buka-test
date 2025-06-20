'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Calculator, Calendar, TrendingUp, BarChart3, PieChart, MapPin, Package } from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'

interface OrderData {
  OrderID: string
  'Item Quantity': string
  'Variation Number': string
  'Order Date': string
  'Variation Name': string
  Attribute: string
  Marketplace: string
  'Delivery Country': string
}

export default function FunctionsPage() {
  const [orders, setOrders] = useState<OrderData[]>([])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string>('')
  const [specificDate, setSpecificDate] = useState('2024-12-31')

  // Load CSV data on component mount
  useEffect(() => {
    loadCSVData()
  }, [])

  const loadCSVData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/fetch-orders')
      const data = await response.json()
      setOrders(data.orders || [])
    } catch (error) {
      console.error('Error loading CSV data:', error)
      setResult('Error loading CSV data')
    } finally {
      setLoading(false)
    }
  }

  // Function 1: Monthly Breakdown
  const calculateMonthlyBreakdown = () => {
    setLoading(true)
    const monthlyData = new Map<string, {uniqueIds: Set<string>, items: number}>()
    
    orders.forEach(order => {
      if (order['Order Date'] && order['Order Date'].trim() !== '') {
        let date: Date | null = null
        
        if (order['Order Date'].includes('T')) {
          date = new Date(order['Order Date'])
        } else if (order['Order Date'].match(/^\d{4}-\d{2}-\d{2}/)) {
          date = new Date(order['Order Date'])
        } else {
          date = new Date(order['Order Date'])
        }
        
        if (date && !isNaN(date.getTime())) {
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
          
          if (!monthlyData.has(monthKey)) {
            monthlyData.set(monthKey, {uniqueIds: new Set(), items: 0})
          }
          
          const monthly = monthlyData.get(monthKey)!
          
          if (order.OrderID && order.OrderID.trim() !== '') {
            monthly.uniqueIds.add(order.OrderID.trim())
          }
          
          monthly.items += parseInt(order['Item Quantity'] || '0')
        }
      }
    })
    
    const breakdown = Array.from(monthlyData.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([monthKey, data]) => {
        const [year, month] = monthKey.split('-')
        const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleString('default', { month: 'long' })
        return `${monthName} ${year}: ${data.uniqueIds.size} orders (${data.items} items)`
      })
      .join('\n')
    
    setResult(`MONTHLY BREAKDOWN:\n\n${breakdown}`)
    setLoading(false)
  }

  // Function 2: Specific Date Analysis
  const calculateSpecificDate = () => {
    setLoading(true)
    const results: {orderId: string, country: string, marketplace: string}[] = []
    const countries = new Set<string>()
    
    orders.forEach(order => {
      if (order['Order Date'] && order['Order Date'].trim() !== '') {
        let date: Date | null = null
        
        if (order['Order Date'].includes('T')) {
          date = new Date(order['Order Date'])
        } else if (order['Order Date'].match(/^\d{4}-\d{2}-\d{2}/)) {
          date = new Date(order['Order Date'])
        } else {
          date = new Date(order['Order Date'])
        }
        
        if (date && !isNaN(date.getTime())) {
          const dateStr = date.toISOString().split('T')[0]
          
          if (dateStr === specificDate) {
            if (order['Delivery Country']) {
              countries.add(order['Delivery Country'])
              results.push({
                orderId: order.OrderID || 'N/A',
                country: order['Delivery Country'],
                marketplace: order.Marketplace || 'N/A'
              })
            }
          }
        }
      }
    })
    
    if (results.length === 0) {
      setResult(`No orders found for ${specificDate}`)
    } else {
      const countryList = Array.from(countries).sort().join(', ')
      setResult(`ORDERS ON ${specificDate}:\n\nCountries: ${countryList}\nTotal orders: ${results.length}\n\nOrder details:\n${results.slice(0, 10).map(r => `${r.orderId} (${r.country} - ${r.marketplace})`).join('\n')}${results.length > 10 ? `\n... and ${results.length - 10} more` : ''}`)
    }
    setLoading(false)
  }

  // Function 3: Marketplace Analysis
  const calculateMarketplaceBreakdown = () => {
    setLoading(true)
    const marketplaceData = new Map<string, {count: number, items: number}>()
    
    orders.forEach(order => {
      if (order.Marketplace) {
        const mp = order.Marketplace.trim()
        const current = marketplaceData.get(mp) || {count: 0, items: 0}
        marketplaceData.set(mp, {
          count: current.count + 1,
          items: current.items + parseInt(order['Item Quantity'] || '0')
        })
      }
    })
    
    const breakdown = Array.from(marketplaceData.entries())
      .sort((a, b) => b[1].items - a[1].items)
      .map(([marketplace, data]) => `${marketplace}: ${data.count} orders (${data.items} items)`)
      .join('\n')
    
    setResult(`MARKETPLACE BREAKDOWN:\n\n${breakdown}`)
    setLoading(false)
  }

  // Function 4: Country Analysis
  const calculateCountryBreakdown = () => {
    setLoading(true)
    const countryData = new Map<string, {count: number, items: number}>()
    
    orders.forEach(order => {
      if (order['Delivery Country']) {
        const country = order['Delivery Country'].trim()
        const current = countryData.get(country) || {count: 0, items: 0}
        countryData.set(country, {
          count: current.count + 1,
          items: current.items + parseInt(order['Item Quantity'] || '0')
        })
      }
    })
    
    const breakdown = Array.from(countryData.entries())
      .sort((a, b) => b[1].items - a[1].items)
      .map(([country, data]) => `${country}: ${data.count} orders (${data.items} items)`)
      .join('\n')
    
    setResult(`COUNTRY BREAKDOWN:\n\n${breakdown}`)
    setLoading(false)
  }

  // Function 5: Product Analysis
  const calculateProductBreakdown = () => {
    setLoading(true)
    const productData = new Map<string, number>()
    
    orders.forEach(order => {
      if (order['Variation Name']) {
        const product = order['Variation Name'].trim()
        productData.set(product, (productData.get(product) || 0) + parseInt(order['Item Quantity'] || '0'))
      }
    })
    
    const breakdown = Array.from(productData.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([product, quantity]) => `${product}: ${quantity} items`)
      .join('\n')
    
    setResult(`TOP 20 PRODUCTS:\n\n${breakdown}`)
    setLoading(false)
  }

  // Function 6: Attribute Analysis
  const calculateAttributeBreakdown = () => {
    setLoading(true)
    const attributeData = new Map<string, number>()
    
    orders.forEach(order => {
      if (order.Attribute) {
        const attr = order.Attribute.trim()
        attributeData.set(attr, (attributeData.get(attr) || 0) + parseInt(order['Item Quantity'] || '0'))
      }
    })
    
    const breakdown = Array.from(attributeData.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([attribute, quantity]) => `${attribute}: ${quantity} items`)
      .join('\n')
    
    setResult(`TOP 20 ATTRIBUTES:\n\n${breakdown}`)
    setLoading(false)
  }

  // Function 7: Data Summary
  const calculateDataSummary = () => {
    setLoading(true)
    const totalOrders = orders.length
    const uniqueOrderIds = new Set(orders.map(o => o.OrderID)).size
    const totalItems = orders.reduce((sum, order) => sum + parseInt(order['Item Quantity'] || '0'), 0)
    const uniqueProducts = new Set(orders.map(o => o['Variation Name'])).size
    const uniqueCountries = new Set(orders.map(o => o['Delivery Country'])).size
    const uniqueMarketplaces = new Set(orders.map(o => o.Marketplace)).size
    
    const dates = orders
      .map(o => o['Order Date'])
      .filter(d => d && d.trim() !== '')
      .map(d => new Date(d))
      .filter(d => !isNaN(d.getTime()))
      .sort((a, b) => a.getTime() - b.getTime())
    
    const firstDate = dates[0]?.toISOString().split('T')[0] || 'N/A'
    const lastDate = dates[dates.length - 1]?.toISOString().split('T')[0] || 'N/A'
    
    setResult(`DATA SUMMARY:\n\nTotal Records: ${totalOrders}\nUnique Order IDs: ${uniqueOrderIds}\nTotal Items: ${totalItems}\nUnique Products: ${uniqueProducts}\nUnique Countries: ${uniqueCountries}\nUnique Marketplaces: ${uniqueMarketplaces}\nDate Range: ${firstDate} to ${lastDate}`)
    setLoading(false)
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <Calculator className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold">Data Analysis Functions</h1>
        </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Monthly Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Monthly Breakdown
            </CardTitle>
            <CardDescription>
              Get precise monthly order counts and item totals
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={calculateMonthlyBreakdown} 
              disabled={loading}
              className="w-full"
            >
              Calculate Monthly Data
            </Button>
          </CardContent>
        </Card>

        {/* Specific Date */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Specific Date Analysis
            </CardTitle>
            <CardDescription>
              Analyze orders for a specific date
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label htmlFor="date">Date (YYYY-MM-DD)</Label>
              <Input
                id="date"
                type="date"
                value={specificDate}
                onChange={(e) => setSpecificDate(e.target.value)}
              />
            </div>
            <Button 
              onClick={calculateSpecificDate} 
              disabled={loading}
              className="w-full"
            >
              Analyze Date
            </Button>
          </CardContent>
        </Card>

        {/* Marketplace Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Marketplace Analysis
            </CardTitle>
            <CardDescription>
              Breakdown by marketplace platforms
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={calculateMarketplaceBreakdown} 
              disabled={loading}
              className="w-full"
            >
              Analyze Marketplaces
            </Button>
          </CardContent>
        </Card>

        {/* Country Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Country Analysis
            </CardTitle>
            <CardDescription>
              Breakdown by delivery countries
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={calculateCountryBreakdown} 
              disabled={loading}
              className="w-full"
            >
              Analyze Countries
            </Button>
          </CardContent>
        </Card>

        {/* Product Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Product Analysis
            </CardTitle>
            <CardDescription>
              Top 20 products by quantity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={calculateProductBreakdown} 
              disabled={loading}
              className="w-full"
            >
              Analyze Products
            </Button>
          </CardContent>
        </Card>

        {/* Attribute Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Attribute Analysis
            </CardTitle>
            <CardDescription>
              Top 20 attributes by quantity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={calculateAttributeBreakdown} 
              disabled={loading}
              className="w-full"
            >
              Analyze Attributes
            </Button>
          </CardContent>
        </Card>

        {/* Data Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Data Summary
            </CardTitle>
            <CardDescription>
              Overall dataset statistics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={calculateDataSummary} 
              disabled={loading}
              className="w-full"
            >
              Generate Summary
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Results Display */}
      {result && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Results</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap text-sm bg-gray-50 dark:bg-gray-900 p-4 rounded-lg overflow-auto max-h-96">
              {result}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span>Calculating...</span>
            </div>
          </div>
        </div>
      )}
      </div>
    </DashboardLayout>
  )
} 