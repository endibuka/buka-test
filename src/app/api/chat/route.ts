import { NextResponse } from 'next/server'

interface OrderData {
  id: number
  order_id: string
  item_quantity: number
  variation_number: string
  order_date: string
  variation_name: string
  attribute: string
  marketplace: string
  delivery_country: string
  created_at: string
}

export async function POST(request: Request) {
  try {
    const { message, ordersData } = await request.json()

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY

    if (!DEEPSEEK_API_KEY) {
      return NextResponse.json(
        { error: 'DeepSeek API key not found. Please add DEEPSEEK_API_KEY to your environment variables.' },
        { status: 500 }
      )
    }

    // Generate comprehensive data analytics
    const analytics = generateComprehensiveAnalytics(ordersData)

    const systemPrompt = `You are a data analyst for an e-commerce business. You have complete access to ${ordersData.length} orders with ALL data available.

IMPORTANT FORMATTING RULES:
- Do NOT use ** or any markdown formatting
- Use plain text only
- Use simple line breaks and dashes for lists
- Be direct and conversational

DATA AVAILABLE:
${analytics}

COMPLETE DATASET FIELDS:
- order_id: unique order identifier  
- item_quantity: number of items per order
- variation_number: product variation code
- order_date: when order was placed
- variation_name: full product name
- attribute: product attribute/color/variation
- marketplace: sales channel (Amazon FBA, eBay, etc.)
- delivery_country: shipping destination

ANALYSIS INSTRUCTIONS:
1. Always analyze the complete dataset provided
2. Give specific numbers and percentages
3. When asked about "most sold" or rankings, calculate actual totals
4. For attributes, count total quantities sold per attribute
5. Show top results with actual numbers
6. Be precise and factual
7. Format lists with simple dashes, no special characters

Answer the user's question using the complete data analysis.`

    // Make request to DeepSeek API
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: message
          }
        ],
        temperature: 0.1,
        max_tokens: 2000,
      }),
    })

    if (!response.ok) {
      console.error('DeepSeek API response not ok:', response.status, response.statusText)
      const errorText = await response.text()
      console.error('DeepSeek API error details:', errorText)
      
      return NextResponse.json(
        { error: `DeepSeek API error: ${response.status} - ${response.statusText}` },
        { status: 500 }
      )
    }

    const data = await response.json()
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      return NextResponse.json(
        { error: 'Invalid response from DeepSeek API' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      response: data.choices[0].message.content
    })

  } catch (error) {
    console.error('Error in chat API:', error)
    return NextResponse.json(
      { error: `Failed to process chat request: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}

function generateComprehensiveAnalytics(orders: OrderData[]): string {
  if (!orders || orders.length === 0) {
    return "No orders data available."
  }

  // Basic stats
  const totalOrders = orders.length
  const totalQuantity = orders.reduce((sum, order) => sum + (order.item_quantity || 0), 0)

  // Attribute analysis (most important for user's question)
  const attributeAnalysis = new Map<string, number>()
  orders.forEach(order => {
    if (order.attribute) {
      const attr = order.attribute.trim()
      attributeAnalysis.set(attr, (attributeAnalysis.get(attr) || 0) + (order.item_quantity || 0))
    }
  })
  
  const topAttributes = Array.from(attributeAnalysis.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)

  // Marketplace analysis
  const marketplaceAnalysis = new Map<string, {count: number, quantity: number}>()
  orders.forEach(order => {
    if (order.marketplace) {
      const mp = order.marketplace.trim()
      const current = marketplaceAnalysis.get(mp) || {count: 0, quantity: 0}
      marketplaceAnalysis.set(mp, {
        count: current.count + 1,
        quantity: current.quantity + (order.item_quantity || 0)
      })
    }
  })

  const topMarketplaces = Array.from(marketplaceAnalysis.entries())
    .sort((a, b) => b[1].quantity - a[1].quantity)
    .slice(0, 10)

  // Country analysis  
  const countryAnalysis = new Map<string, {count: number, quantity: number}>()
  orders.forEach(order => {
    if (order.delivery_country) {
      const country = order.delivery_country.trim()
      const current = countryAnalysis.get(country) || {count: 0, quantity: 0}
      countryAnalysis.set(country, {
        count: current.count + 1,
        quantity: current.quantity + (order.item_quantity || 0)
      })
    }
  })

  const topCountries = Array.from(countryAnalysis.entries())
    .sort((a, b) => b[1].quantity - a[1].quantity)
    .slice(0, 10)

  // Product analysis
  const productAnalysis = new Map<string, number>()
  orders.forEach(order => {
    if (order.variation_name) {
      const product = order.variation_name.trim()
      productAnalysis.set(product, (productAnalysis.get(product) || 0) + (order.item_quantity || 0))
    }
  })

  const topProducts = Array.from(productAnalysis.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)

  // Date analysis
  const dates = orders.map(order => new Date(order.order_date)).filter(date => !isNaN(date.getTime()))
  const oldestDate = dates.length > 0 ? new Date(Math.min(...dates.map(d => d.getTime()))) : null
  const newestDate = dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))) : null

  return `COMPLETE ANALYTICS FOR ${totalOrders} ORDERS:

SUMMARY:
Total Orders: ${totalOrders}
Total Items Sold: ${totalQuantity}
Average Items per Order: ${(totalQuantity / totalOrders).toFixed(2)}
Date Range: ${oldestDate?.toDateString()} to ${newestDate?.toDateString()}

TOP ATTRIBUTES BY QUANTITY SOLD:
${topAttributes.map((attr, idx) => `${idx + 1}. ${attr[0]}: ${attr[1]} units`).join('\n')}

TOP MARKETPLACES BY VOLUME:
${topMarketplaces.map((mp, idx) => `${idx + 1}. ${mp[0]}: ${mp[1].quantity} units (${mp[1].count} orders)`).join('\n')}

TOP COUNTRIES BY VOLUME:
${topCountries.map((country, idx) => `${idx + 1}. ${country[0]}: ${country[1].quantity} units (${country[1].count} orders)`).join('\n')}

TOP PRODUCTS BY QUANTITY:
${topProducts.map((product, idx) => `${idx + 1}. ${product[0]}: ${product[1]} units`).join('\n')}

ALL UNIQUE ATTRIBUTES (${attributeAnalysis.size} total):
${Array.from(attributeAnalysis.keys()).sort().join(', ')}

ALL UNIQUE MARKETPLACES (${marketplaceAnalysis.size} total):
${Array.from(marketplaceAnalysis.keys()).sort().join(', ')}

ALL UNIQUE COUNTRIES (${countryAnalysis.size} total):
${Array.from(countryAnalysis.keys()).sort().join(', ')}`
} 