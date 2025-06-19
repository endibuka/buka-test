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

    // Prepare data summary for the AI
    const dataSummary = generateDataSummary(ordersData)

    const systemPrompt = `You are a helpful data analyst assistant. You have access to orders data from an e-commerce system. 

Here's a summary of the available data:
${dataSummary}

The complete dataset contains ${ordersData.length} orders with the following fields:
- order_id: unique identifier for each order
- item_quantity: number of items in the order
- variation_number: product variation identifier
- order_date: when the order was placed
- variation_name: name of the product variation
- attribute: product attributes
- marketplace: where the order was placed (e.g., Amazon, eBay, etc.)
- delivery_country: destination country for the order

When answering questions:
1. Be specific and provide actual numbers from the data
2. If asked for trends or patterns, analyze the data provided
3. Format your response in a clear, conversational way
4. If you need to show lists or data, format them nicely
5. Always base your answers on the actual data provided

Answer the user's question about this orders data.`

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
        temperature: 0.3,
        max_tokens: 1000,
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

function generateDataSummary(orders: OrderData[]): string {
  if (!orders || orders.length === 0) {
    return "No orders data available."
  }

  // Calculate basic statistics
  const totalOrders = orders.length
  const totalQuantity = orders.reduce((sum, order) => sum + (order.item_quantity || 0), 0)
  const avgQuantity = totalQuantity / totalOrders

  // Get unique marketplaces
  const marketplaces = [...new Set(orders.map(order => order.marketplace))].filter(Boolean)
  const marketplaceCounts = marketplaces.map(marketplace => ({
    marketplace,
    count: orders.filter(order => order.marketplace === marketplace).length
  })).sort((a, b) => b.count - a.count)

  // Get unique countries
  const countries = [...new Set(orders.map(order => order.delivery_country))].filter(Boolean)
  const countryCounts = countries.map(country => ({
    country,
    count: orders.filter(order => order.delivery_country === country).length
  })).sort((a, b) => b.count - a.count)

  // Get date range
  const dates = orders.map(order => new Date(order.order_date)).filter(date => !isNaN(date.getTime()))
  const oldestDate = dates.length > 0 ? new Date(Math.min(...dates.map(d => d.getTime()))) : null
  const newestDate = dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))) : null

  let summary = `Data Summary:
- Total Orders: ${totalOrders}
- Total Items: ${totalQuantity}
- Average Quantity per Order: ${avgQuantity.toFixed(2)}

Top Marketplaces:
${marketplaceCounts.slice(0, 5).map(m => `- ${m.marketplace}: ${m.count} orders`).join('\n')}

Top Delivery Countries:
${countryCounts.slice(0, 5).map(c => `- ${c.country}: ${c.count} orders`).join('\n')}`

  if (oldestDate && newestDate) {
    summary += `\n\nDate Range: ${oldestDate.toDateString()} to ${newestDate.toDateString()}`
  }

  return summary
} 