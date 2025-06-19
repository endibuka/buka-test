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

    // Smart query classification and direct functions
    const queryResult = await handleSmartQuery(message, ordersData)
    if (queryResult) {
      // Generate AI-powered contextual suggestions
      const suggestions = await generateAISuggestions(queryResult.response, message, DEEPSEEK_API_KEY)
      
      const response: any = {
        response: queryResult.response
      }
      
      if (suggestions && suggestions.length > 0) {
        response.suggestions = suggestions
      }
      
      return NextResponse.json(response)
    }

    // For complex queries, use full AI analysis
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
- order_date: when order was placed (stored as string, format varies)
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
8. When asked about specific order IDs, ALWAYS check the "ALL ORDER IDS AVAILABLE" list first
9. If an order ID is found, look it up in the "DETAILED ORDER LOOKUP" section for full details
10. For date queries, use the exact date strings from the data, don't try to reformat them
11. If an order ID is not found in the "ALL ORDER IDS AVAILABLE" list, clearly state "Order ID [number] not found in the database"
12. NEVER say an order doesn't exist without checking the complete order ID list

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

    const aiResponse = data.choices[0].message.content
    
    // Generate AI-powered contextual suggestions for complex queries too
    const suggestions = await generateAISuggestions(aiResponse, message, DEEPSEEK_API_KEY)
    
    const finalResponse: any = {
      response: aiResponse
    }
    
    if (suggestions && suggestions.length > 0) {
      finalResponse.suggestions = suggestions
    }

    return NextResponse.json(finalResponse)

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

  // Date analysis - handle VARCHAR dates properly
  const validDates: Date[] = []
  const monthlyAnalysis = new Map<string, {uniqueOrders: Set<string>, totalQuantity: number}>()
  
  orders.forEach(order => {
    if (order.order_date) {
      // Try to parse the date string - it could be in various formats
      let date: Date | null = null
      
      // Try ISO format first (2025-02-12T13:43:49+01:00)
      if (order.order_date.includes('T')) {
        date = new Date(order.order_date)
      }
      // Try simple date format (2025-02-12)
      else if (order.order_date.match(/^\d{4}-\d{2}-\d{2}/)) {
        date = new Date(order.order_date)
      }
      // Try other common formats
      else {
        date = new Date(order.order_date)
      }
      
      if (date && !isNaN(date.getTime())) {
        validDates.push(date)
        
        // Monthly analysis
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        if (!monthlyAnalysis.has(monthKey)) {
          monthlyAnalysis.set(monthKey, {
            uniqueOrders: new Set<string>(),
            totalQuantity: 0
          })
        }
        const monthly = monthlyAnalysis.get(monthKey)!
        if (order.order_id) {
          monthly.uniqueOrders.add(order.order_id)
        }
        monthly.totalQuantity += (order.item_quantity || 0)
      }
    }
  })

  const oldestDate = validDates.length > 0 ? new Date(Math.min(...validDates.map(d => d.getTime()))) : null
  const newestDate = validDates.length > 0 ? new Date(Math.max(...validDates.map(d => d.getTime()))) : null

  // Order ID analysis for specific queries (efficient version)
  const orderIdAnalysis = new Map<string, any>()
  orders.forEach(order => {
    if (order.order_id) {
      orderIdAnalysis.set(order.order_id, {
        order_date: order.order_date,
        variation_name: order.variation_name,
        marketplace: order.marketplace,
        delivery_country: order.delivery_country,
        attribute: order.attribute,
        item_quantity: order.item_quantity
      })
    }
  })

  // Monthly report for 2024
  const monthly2024 = Array.from(monthlyAnalysis.entries())
    .filter(([monthKey]) => monthKey.startsWith('2024'))
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([monthKey, data]) => {
      const [year, month] = monthKey.split('-')
      const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleString('default', { month: 'long' })
      return `${monthName} 2024: ${data.uniqueOrders.size} unique orders, ${data.totalQuantity} total items`
    })

  return `COMPLETE ANALYTICS FOR ${totalOrders} ORDERS:

SUMMARY:
Total Orders: ${totalOrders}
Total Items Sold: ${totalQuantity}
Unique Order IDs: ${orderIdAnalysis.size}
Average Items per Order: ${(totalQuantity / totalOrders).toFixed(2)}
Date Range: ${oldestDate?.toDateString()} to ${newestDate?.toDateString()}
Valid Dates Found: ${validDates.length} out of ${totalOrders} orders

2024 MONTHLY REPORT (Unique Order IDs Only):
${monthly2024.length > 0 ? monthly2024.join('\n') : 'No 2024 data found'}

TOP ATTRIBUTES BY QUANTITY SOLD:
${topAttributes.map((attr, idx) => `${idx + 1}. ${attr[0]}: ${attr[1]} units`).join('\n')}

TOP MARKETPLACES BY VOLUME:
${topMarketplaces.map((mp, idx) => `${idx + 1}. ${mp[0]}: ${mp[1].quantity} units (${mp[1].count} orders)`).join('\n')}

TOP COUNTRIES BY VOLUME:
${topCountries.map((country, idx) => `${idx + 1}. ${country[0]}: ${country[1].quantity} units (${country[1].count} orders)`).join('\n')}

TOP PRODUCTS BY QUANTITY:
${topProducts.map((product, idx) => `${idx + 1}. ${product[0]}: ${product[1]} units`).join('\n')}

ORDER ID SEARCH CAPABILITY:
- Total Unique Order IDs: ${orderIdAnalysis.size}
- Order ID Range: ${Math.min(...Array.from(orderIdAnalysis.keys()).map(id => parseInt(id) || 0))} to ${Math.max(...Array.from(orderIdAnalysis.keys()).map(id => parseInt(id) || 0))}
- When asked about specific order IDs, I can search through all ${orderIdAnalysis.size} unique orders

ALL UNIQUE ATTRIBUTES (${attributeAnalysis.size} total):
${Array.from(attributeAnalysis.keys()).sort().join(', ')}

ALL UNIQUE MARKETPLACES (${marketplaceAnalysis.size} total):
${Array.from(marketplaceAnalysis.keys()).sort().join(', ')}

ALL UNIQUE COUNTRIES (${countryAnalysis.size} total):
${Array.from(countryAnalysis.keys()).sort().join(', ')}`
}

async function handleSmartQuery(message: string, ordersData: OrderData[]): Promise<{response: string, type: string} | null> {
  const lowerMessage = message.toLowerCase()
  
  // Order ID search
  const orderIdMatch = message.match(/order\s+(?:id\s+)?(\d+)/i)
  if (orderIdMatch) {
    const searchOrderId = orderIdMatch[1]
    const foundOrder = ordersData.find((order: OrderData) => order.order_id === searchOrderId)
    
    if (foundOrder) {
      return {
        response: `✅ Order ID ${searchOrderId} found:

📅 Date: ${foundOrder.order_date}
📦 Product: ${foundOrder.variation_name}
🔢 Quantity: ${foundOrder.item_quantity}
🎨 Attribute: ${foundOrder.attribute}
🏪 Marketplace: ${foundOrder.marketplace}
🌍 Delivery Country: ${foundOrder.delivery_country}
📋 Variation Number: ${foundOrder.variation_number}`,
        type: 'order_lookup'
      }
    } else {
      return {
        response: `❌ Order ID ${searchOrderId} not found in the database.`,
        type: 'order_not_found'
      }
    }
  }

  // Row count queries
  if (lowerMessage.includes('how many') && (lowerMessage.includes('rows') || lowerMessage.includes('orders') || lowerMessage.includes('total'))) {
    const uniqueOrderIds = new Set(ordersData.map(order => order.order_id)).size
    const totalRows = ordersData.length
    
    return {
      response: `📊 Database Statistics:

🔢 Total Rows: ${totalRows.toLocaleString()}
🆔 Unique Order IDs: ${uniqueOrderIds.toLocaleString()}
📈 Duplicate Entries: ${(totalRows - uniqueOrderIds).toLocaleString()}
📋 Average Items per Order: ${(ordersData.reduce((sum, order) => sum + (order.item_quantity || 0), 0) / totalRows).toFixed(2)}`,
      type: 'count_query'
    }
  }

  // Date range queries
  if (lowerMessage.includes('date range') || (lowerMessage.includes('oldest') && lowerMessage.includes('newest'))) {
    const validDates = ordersData
      .map(order => new Date(order.order_date))
      .filter(date => !isNaN(date.getTime()))
      .sort((a, b) => a.getTime() - b.getTime())
    
    if (validDates.length > 0) {
      return {
        response: `📅 Date Range Information:

📅 Oldest Order: ${validDates[0].toDateString()}
📅 Newest Order: ${validDates[validDates.length - 1].toDateString()}
📊 Total Days Span: ${Math.ceil((validDates[validDates.length - 1].getTime() - validDates[0].getTime()) / (1000 * 60 * 60 * 24))} days
✅ Valid Dates: ${validDates.length.toLocaleString()} out of ${ordersData.length.toLocaleString()} orders`,
        type: 'date_range'
      }
    }
  }

  // Marketplace count (specific pattern to avoid conflicts)
  if (lowerMessage.includes('marketplace') && (lowerMessage.includes('how many') || lowerMessage.includes('count')) &&
      !lowerMessage.includes('delivery country') && !lowerMessage.includes('country') && !lowerMessage.includes('percentage')) {
    const marketplaces = new Set(ordersData.map(order => order.marketplace).filter(mp => mp))
    
    return {
      response: `🏪 Marketplace Information:

🔢 Total Marketplaces: ${marketplaces.size}
📋 Marketplaces: ${Array.from(marketplaces).sort().join(', ')}`,
      type: 'marketplace_count'
    }
  }

  // Attribute analysis for specific marketplace and country combination
  if ((lowerMessage.includes('attribute') || lowerMessage.includes('color') || lowerMessage.includes('variation')) &&
      lowerMessage.includes('most') && lowerMessage.includes('commonly') &&
      (lowerMessage.includes('hauptstadtkoffer') || lowerMessage.includes('marketplace')) &&
      lowerMessage.includes('country')) {
    
    // Find the marketplace (Hauptstadtkoffer or determine top marketplace)
    let targetMarketplace = 'Hauptstadtkoffer'
    if (!lowerMessage.includes('hauptstadtkoffer')) {
      const marketplaceCount = new Map<string, number>()
      ordersData.forEach(order => {
        if (order.marketplace) {
          const mp = order.marketplace.trim()
          marketplaceCount.set(mp, (marketplaceCount.get(mp) || 0) + 1)
        }
      })
      const topMP = Array.from(marketplaceCount.entries()).sort((a, b) => b[1] - a[1])[0]
      if (topMP) targetMarketplace = topMP[0]
    }
    
    // Get orders for this marketplace
    const marketplaceOrders = ordersData.filter(order => 
      order.marketplace?.trim() === targetMarketplace
    )
    
    if (marketplaceOrders.length > 0) {
      // Find top delivery country for this marketplace
      const countryStats = new Map<string, number>()
      marketplaceOrders.forEach(order => {
        if (order.delivery_country) {
          const country = order.delivery_country.trim()
          countryStats.set(country, (countryStats.get(country) || 0) + 1)
        }
      })
      
      const topCountry = Array.from(countryStats.entries()).sort((a, b) => b[1] - a[1])[0]
      
      if (topCountry) {
        // Filter orders for this marketplace + top country combination
        const targetCountryOrders = marketplaceOrders.filter(order => 
          order.delivery_country?.trim() === topCountry[0]
        )
        
        // Analyze attributes for this specific combination
        const attributeStats = new Map<string, number>()
        targetCountryOrders.forEach(order => {
          if (order.attribute) {
            const attr = order.attribute.trim()
            attributeStats.set(attr, (attributeStats.get(attr) || 0) + (order.item_quantity || 1))
          }
        })
        
        const topAttributes = Array.from(attributeStats.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
        
        if (topAttributes.length > 0) {
          const topAttribute = topAttributes[0]
          
          return {
            response: `🎨 Most Common Attribute for ${targetMarketplace} in ${topCountry[0]}:

🥇 Top Attribute: ${topAttribute[0]} - ${topAttribute[1]} items ordered

📊 Analysis Details:
🏪 Marketplace: ${targetMarketplace}
🌍 Top Country: ${topCountry[0]} (${topCountry[1].toLocaleString()} orders)
📦 Orders Analyzed: ${targetCountryOrders.length.toLocaleString()}

🎨 Top 5 Attributes in ${topCountry[0]}:
${topAttributes.map(([attr, count], idx) => 
  `${idx + 1}. ${attr}: ${count} items`
).join('\n')}`,
            type: 'marketplace_country_attribute_analysis'
          }
        }
      }
    }
    
    return {
      response: `❌ Unable to analyze attributes for ${targetMarketplace}. No sufficient data found.`,
      type: 'insufficient_data'
    }
  }

  // Country count (much more specific pattern to avoid conflicts)
  if (lowerMessage.includes('country') && (lowerMessage.includes('how many') || lowerMessage.includes('count')) &&
      !lowerMessage.includes('attribute') && !lowerMessage.includes('color') && !lowerMessage.includes('variation') &&
      !lowerMessage.includes('most') && !lowerMessage.includes('commonly') && !lowerMessage.includes('marketplace')) {
    const countries = new Set(ordersData.map(order => order.delivery_country).filter(country => country))
    
    return {
      response: `🌍 Country Information:

🔢 Total Countries: ${countries.size}
📋 Countries: ${Array.from(countries).sort().join(', ')}`,
      type: 'country_count'
    }
  }

  // Monthly counts for specific year
  const yearMatch = message.match(/monthly.*(\d{4})|(\d{4}).*monthly/i)
  if (yearMatch) {
    const year = yearMatch[1] || yearMatch[2]
    const monthlyData = getMonthlyData(ordersData, year)
    
    return {
      response: `📅 Monthly Report for ${year}:

${monthlyData.map(month => `📊 ${month.name}: ${month.uniqueOrders} unique orders, ${month.totalItems} items`).join('\n')}

🔢 Total ${year}: ${monthlyData.reduce((sum, month) => sum + month.uniqueOrders, 0)} unique orders`,
      type: 'monthly_report'
    }
  }

  // Most popular marketplace
  if (lowerMessage.includes('most popular marketplace') || lowerMessage.includes('popular marketplace')) {
    const marketplaceCount = new Map<string, number>()
    ordersData.forEach(order => {
      if (order.marketplace) {
        const mp = order.marketplace.trim()
        marketplaceCount.set(mp, (marketplaceCount.get(mp) || 0) + 1)
      }
    })
    
    const topMarketplace = Array.from(marketplaceCount.entries())
      .sort((a, b) => b[1] - a[1])[0]
    
    if (topMarketplace) {
      return {
        response: `🏪 Most Popular Marketplace:

🥇 ${topMarketplace[0]}: ${topMarketplace[1].toLocaleString()} orders

📊 Top 5 Marketplaces:
${Array.from(marketplaceCount.entries())
  .sort((a, b) => b[1] - a[1])
  .slice(0, 5)
  .map(([mp, count], idx) => `${idx + 1}. ${mp}: ${count.toLocaleString()} orders`)
  .join('\n')}`,
        type: 'popular_marketplace'
      }
    }
  }

  // Orders from specific country (e.g., Germany)
  const countryMatch = message.match(/(?:orders from|from)\s+([A-Z][a-z]{2,}(?:\s+[A-Z][a-z]+)*)|show.*orders.*from\s+([A-Z][a-z]{2,}(?:\s+[A-Z][a-z]+)*)/i)
  if (countryMatch && !message.toLowerCase().includes('may') && !message.toLowerCase().includes('june') && !message.toLowerCase().includes('july') && !message.toLowerCase().includes('august') && !message.toLowerCase().includes('september') && !message.toLowerCase().includes('october') && !message.toLowerCase().includes('november') && !message.toLowerCase().includes('december') && !message.toLowerCase().includes('january') && !message.toLowerCase().includes('february') && !message.toLowerCase().includes('march') && !message.toLowerCase().includes('april')) {
    const country = countryMatch[1] || countryMatch[2]
    const countryOrders = ordersData.filter(order => 
      order.delivery_country?.toLowerCase().includes(country.toLowerCase())
    )
    
    if (countryOrders.length > 0) {
      const uniqueOrderIds = new Set(countryOrders.map(order => order.order_id)).size
      const totalItems = countryOrders.reduce((sum, order) => sum + (order.item_quantity || 0), 0)
      
      return {
        response: `🌍 Orders from ${country}:

📊 Total Orders: ${countryOrders.length.toLocaleString()}
🆔 Unique Order IDs: ${uniqueOrderIds.toLocaleString()}
📦 Total Items: ${totalItems.toLocaleString()}
📈 Average Items per Order: ${(totalItems / countryOrders.length).toFixed(2)}

🏪 Top Marketplaces in ${country}:
${getTopMarketplacesForCountry(countryOrders).slice(0, 3)
  .map(([mp, count], idx) => `${idx + 1}. ${mp}: ${count} orders`)
  .join('\n')}`,
        type: 'country_orders'
      }
    } else {
      return {
        response: `❌ No orders found for "${country}". Please check the country name spelling.`,
        type: 'country_not_found'
      }
    }
  }

  // Marketplace average item_quantity analysis
  if (lowerMessage.includes('marketplace') && lowerMessage.includes('average') && lowerMessage.includes('item_quantity')) {
    const marketplaceStats = new Map<string, {totalQuantity: number, orderCount: number}>()
    
    ordersData.forEach(order => {
      if (order.marketplace) {
        const mp = order.marketplace.trim()
        const current = marketplaceStats.get(mp) || {totalQuantity: 0, orderCount: 0}
        marketplaceStats.set(mp, {
          totalQuantity: current.totalQuantity + (order.item_quantity || 0),
          orderCount: current.orderCount + 1
        })
      }
    })
    
    const marketplaceAverages = Array.from(marketplaceStats.entries())
      .map(([marketplace, stats]) => ({
        marketplace,
        average: stats.totalQuantity / stats.orderCount,
        totalQuantity: stats.totalQuantity,
        orderCount: stats.orderCount
      }))
      .sort((a, b) => b.average - a.average)
    
    const topMarketplace = marketplaceAverages[0]
    
    return {
      response: `🏪 Marketplace with Highest Average Item Quantity per Order:

🥇 ${topMarketplace.marketplace}: ${topMarketplace.average.toFixed(2)} items per order
📊 Total Orders: ${topMarketplace.orderCount.toLocaleString()}
📦 Total Items: ${topMarketplace.totalQuantity.toLocaleString()}

📊 Top 5 Marketplaces by Average Item Quantity:
${marketplaceAverages.slice(0, 5).map(({marketplace, average, orderCount}, idx) => 
  `${idx + 1}. ${marketplace}: ${average.toFixed(2)} items/order (${orderCount} orders)`
).join('\n')}`,
      type: 'marketplace_average_quantity'
    }
  }

  // Country breakdown for specific marketplace
  if ((lowerMessage.includes('delivery country') || lowerMessage.includes('country')) && 
      (lowerMessage.includes('hauptstadtkoffer') || lowerMessage.includes('top marketplace'))) {
    
    // Find the marketplace - either explicitly mentioned or determine the top one
    let targetMarketplace = 'Hauptstadtkoffer'
    if (!lowerMessage.includes('hauptstadtkoffer')) {
      // Find the top marketplace by order count
      const marketplaceCount = new Map<string, number>()
      ordersData.forEach(order => {
        if (order.marketplace) {
          const mp = order.marketplace.trim()
          marketplaceCount.set(mp, (marketplaceCount.get(mp) || 0) + 1)
        }
      })
      const topMP = Array.from(marketplaceCount.entries()).sort((a, b) => b[1] - a[1])[0]
      if (topMP) targetMarketplace = topMP[0]
    }
    
    const marketplaceOrders = ordersData.filter(order => 
      order.marketplace?.trim() === targetMarketplace
    )
    
    if (marketplaceOrders.length > 0) {
      const countryStats = new Map<string, number>()
      marketplaceOrders.forEach(order => {
        if (order.delivery_country) {
          const country = order.delivery_country.trim()
          countryStats.set(country, (countryStats.get(country) || 0) + 1)
        }
      })
      
      const totalMarketplaceOrders = marketplaceOrders.length
      const topCountries = Array.from(countryStats.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([country, count]) => ({
          country,
          count,
          percentage: ((count / totalMarketplaceOrders) * 100).toFixed(1)
        }))
      
      const topCountry = topCountries[0]
      
      return {
        response: `🌍 Delivery Countries for ${targetMarketplace}:

🥇 Top Country: ${topCountry.country} - ${topCountry.count.toLocaleString()} orders (${topCountry.percentage}%)

📊 Top 5 Countries for ${targetMarketplace}:
${topCountries.map(({country, count, percentage}, idx) => 
  `${idx + 1}. ${country}: ${count.toLocaleString()} orders (${percentage}%)`
).join('\n')}

📈 Total ${targetMarketplace} Orders: ${totalMarketplaceOrders.toLocaleString()}`,
        type: 'marketplace_country_breakdown'
      }
    }
  }

  // Average order quantity (general)
  if (lowerMessage.includes('average') && (lowerMessage.includes('quantity') || lowerMessage.includes('order')) && 
      !lowerMessage.includes('marketplace')) {
    const totalQuantity = ordersData.reduce((sum, order) => sum + (order.item_quantity || 0), 0)
    const totalOrders = ordersData.length
    const uniqueOrders = new Set(ordersData.map(order => order.order_id)).size
    
    return {
      response: `📊 Order Quantity Statistics:

📦 Average Items per Row: ${(totalQuantity / totalOrders).toFixed(2)}
🆔 Average Items per Unique Order: ${(totalQuantity / uniqueOrders).toFixed(2)}
🔢 Total Items: ${totalQuantity.toLocaleString()}
📋 Total Rows: ${totalOrders.toLocaleString()}
🆔 Unique Orders: ${uniqueOrders.toLocaleString()}`,
      type: 'average_quantity'
    }
  }

  // Most frequent variation name
  if (lowerMessage.includes('variation name') && (lowerMessage.includes('most') || lowerMessage.includes('frequent'))) {
    const variationCount = new Map<string, number>()
    ordersData.forEach(order => {
      if (order.variation_name) {
        const variation = order.variation_name.trim()
        variationCount.set(variation, (variationCount.get(variation) || 0) + (order.item_quantity || 1))
      }
    })
    
    const topVariations = Array.from(variationCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
    
    if (topVariations.length > 0) {
      return {
        response: `📦 Most Frequent Variation Names:

🥇 ${topVariations[0][0]}: ${topVariations[0][1]} items

📊 Top 5 Products:
${topVariations.map(([variation, count], idx) => 
  `${idx + 1}. ${variation.substring(0, 60)}${variation.length > 60 ? '...' : ''}: ${count} items`
).join('\n')}`,
        type: 'frequent_variations'
      }
    }
  }

  // Last month orders
  if (lowerMessage.includes('last month') || lowerMessage.includes('recent month')) {
    const now = new Date()
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    
    const lastMonthOrders = ordersData.filter(order => {
      const orderDate = new Date(order.order_date)
      return !isNaN(orderDate.getTime()) && orderDate >= lastMonth && orderDate < thisMonth
    })
    
    const uniqueLastMonth = new Set(lastMonthOrders.map(order => order.order_id)).size
    const totalItems = lastMonthOrders.reduce((sum, order) => sum + (order.item_quantity || 0), 0)
    
    const monthName = lastMonth.toLocaleString('default', { month: 'long', year: 'numeric' })
    
    return {
      response: `📅 Orders from Last Month (${monthName}):

📊 Total Orders: ${lastMonthOrders.length.toLocaleString()}
🆔 Unique Order IDs: ${uniqueLastMonth.toLocaleString()}
📦 Total Items: ${totalItems.toLocaleString()}
📈 Average Items per Order: ${lastMonthOrders.length > 0 ? (totalItems / lastMonthOrders.length).toFixed(2) : '0'}`,
      type: 'last_month'
    }
  }

  return null
}

function getMonthlyData(ordersData: OrderData[], year: string) {
  const monthlyMap = new Map<string, {uniqueOrders: Set<string>, totalItems: number}>()
  
  ordersData.forEach(order => {
    const date = new Date(order.order_date)
    if (!isNaN(date.getTime()) && date.getFullYear().toString() === year) {
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      
      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, {
          uniqueOrders: new Set<string>(),
          totalItems: 0
        })
      }
      
      const monthly = monthlyMap.get(monthKey)!
      if (order.order_id) {
        monthly.uniqueOrders.add(order.order_id)
      }
      monthly.totalItems += (order.item_quantity || 0)
    }
  })
  
  return Array.from(monthlyMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([monthKey, data]) => {
      const [_, month] = monthKey.split('-')
      const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleString('default', { month: 'long' })
      return {
        name: monthName,
        uniqueOrders: data.uniqueOrders.size,
        totalItems: data.totalItems
      }
    })
}

function getTopMarketplacesForCountry(orders: OrderData[]) {
  const marketplaceCount = new Map<string, number>()
  orders.forEach(order => {
    if (order.marketplace) {
      const mp = order.marketplace.trim()
      marketplaceCount.set(mp, (marketplaceCount.get(mp) || 0) + 1)
    }
  })
  
  return Array.from(marketplaceCount.entries()).sort((a, b) => b[1] - a[1]) 
}

async function generateAISuggestions(response: string, originalMessage: string, apiKey: string): Promise<string[]> {
  try {
    const suggestionPrompt = `You are an expert data analyst assistant. Based on the user's original question and the response provided, generate 6 highly relevant follow-up questions that can be answered using ONLY the available CSV data.

ORIGINAL USER QUESTION: "${originalMessage}"

RESPONSE PROVIDED:
${response}

AVAILABLE DATA FIELDS ONLY:
- order_id: unique order identifier
- order_date: when order was placed
- marketplace: sales channel (Amazon, eBay, etc.)
- delivery_country: shipping destination
- variation_name: product name
- attribute: product color/variation
- item_quantity: number of items per order

STRICT RULES for generating suggestions:
1. Questions MUST be answerable with the available data fields above
2. DO NOT suggest questions about: external factors, promotions, competitors, economic shifts, system issues, data gaps, customer demographics, revenue, or anything outside our CSV data
3. Focus on analyzing patterns within our data: trends, comparisons, breakdowns by marketplace/country/product
4. Use specific numbers, dates, or names from the response
5. Suggest deeper analysis of the data we actually have
6. Focus on finding patterns, top performers, comparisons between categories
7. Keep questions actionable and specific to the shown data

Examples of GOOD suggestions:
- "Which marketplace had the most orders in May 2024?"
- "What are the top 5 products sold during the peak month?"
- "Show me Germany vs Italy order comparison for 2024"
- "Which product attributes were most popular in the high-volume months?"

Examples of BAD suggestions (DO NOT generate these):
- Questions about external factors, promotions, or business reasons
- Questions about revenue, pricing, or financial data
- Questions about customer demographics or segmentation
- Questions about system issues or data collection problems

Generate exactly 6 follow-up questions, one per line, without numbering or bullet points.`

    const suggestionResponse = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'user',
            content: suggestionPrompt
          }
        ],
        temperature: 0.5,
        max_tokens: 400,
      }),
    })

    if (!suggestionResponse.ok) {
      console.error('Failed to generate AI suggestions:', suggestionResponse.status)
      return []
    }

    const suggestionData = await suggestionResponse.json()
    
    if (suggestionData.choices && suggestionData.choices[0] && suggestionData.choices[0].message) {
      const suggestionsText = suggestionData.choices[0].message.content.trim()
      const suggestions = suggestionsText
        .split('\n')
        .map((s: string) => s.trim())
        .filter((s: string) => s.length > 0)
        .slice(0, 6) // Ensure exactly 6 suggestions
      
      return suggestions
    }

    return []
  } catch (error) {
    console.error('Error generating AI suggestions:', error)
    return []
  }
} 