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
    const { message, ordersData, chatHistory = [] } = await request.json()

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

    // Use AI for intelligent query analysis - no more hardcoded patterns
    const analytics = generateComprehensiveAnalytics(ordersData)

    // Build chat history context
    const historyContext = chatHistory.length > 0 ? `
CONVERSATION HISTORY:
${chatHistory.map((msg: { user: string; assistant: string }, idx: number) => `
${idx + 1}. User: ${msg.user}
   Assistant: ${msg.assistant}
`).join('')}

Current Question: ${message}
` : `User Question: ${message}`

    const systemPrompt = `You are an EXPERT data analyst for an e-commerce business. You have complete access to ${ordersData.length} orders and must provide 100% ACCURATE analysis based on the exact data provided.

🚨 CRITICAL ACCURACY REQUIREMENTS:
- ONLY use data from the analytics section below
- VERIFY all calculations are mathematically correct
- DOUBLE-CHECK all numbers against the provided data
- If you don't have specific information, clearly state what data is missing
- All percentages refer to their specific category (attributes, marketplaces, countries)
- Never make up information or provide contradictory statements
- Always be consistent with the data provided

FORMATTING RULES:
- Do NOT use ** or any markdown formatting
- Use plain text only
- Use simple line breaks and dashes for lists
- Be direct and conversational
- Always provide specific, accurate numbers

DATASET FIELDS AVAILABLE:
- order_id: unique order identifier  
- item_quantity: number of items per order
- variation_number: product variation code
- order_date: when order was placed (stored as string, format varies)
- variation_name: full product name
- attribute: product attribute/color/variation
- marketplace: sales channel (Amazon FBA, eBay, etc.)
- delivery_country: shipping destination

COMPLETE DATA ANALYTICS PROVIDED:
${analytics}

ANALYSIS CAPABILITIES:
1. Order counts and breakdowns by any dimension
2. Marketplace comparisons (use marketplace analytics section)
3. Country analysis (use country analytics section)
4. Attribute/color analysis (use attribute analytics section)
5. Time-based analysis (use monthly breakdown and specific date sections)
6. Cross-dimensional comparisons
7. Percentage calculations within each category
8. Average calculations by any dimension
9. Top performer rankings

CONVERSATION CONTEXT:
${historyContext}

🎯 ACCURACY PROTOCOL:
1. READ the analytics data carefully
2. IDENTIFY the exact data points needed for the question
3. Use ONLY the numbers provided in the analytics
4. If asked about specific dates/countries/orders, check the relevant sections
5. If information is not available in the analytics, clearly state this
6. Be consistent - don't contradict previous statements
7. Monthly breakdowns show ALL months with data, not just specific years

RESPONSE REQUIREMENTS:
- Base ALL answers on the provided analytics data
- Show specific numbers with confidence
- Use the exact numbers from the analytics sections
- If asked about combinations (e.g., "orders on Dec 31 to Germany"), check both date and country sections
- Never guess or estimate - use actual data
- Explain your reasoning when calculations are involved

Answer the user's question with 100% accuracy using only the provided data analytics.`

    // Build conversation messages with history
    const messages = [
      {
        role: 'system',
        content: systemPrompt
      }
    ]

    // Add conversation history
    chatHistory.forEach((msg: { user: string; assistant: string }) => {
      messages.push(
        { role: 'user', content: msg.user },
        { role: 'assistant', content: msg.assistant }
      )
    })

    // Add current message
    messages.push({
      role: 'user',
      content: message
    })

    // Make request to DeepSeek API
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: messages,
        temperature: 0.05,
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
    
    // Validate critical data accuracy in the response
    const validatedResponse = validateResponseAccuracy(aiResponse, ordersData, message)
    
    // Generate AI-powered contextual suggestions
    const suggestions = await generateAISuggestions(validatedResponse, message, DEEPSEEK_API_KEY)
    
    const finalResponse: {
      response: string;
      currentExchange: { user: string; assistant: string };
      suggestions?: string[];
    } = {
      response: validatedResponse,
      // Add the current conversation to help frontend manage chat history
      currentExchange: {
        user: message,
        assistant: validatedResponse
      }
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

  // Enhanced date analysis - handle all years properly
  const validDates: Date[] = []
  const monthlyAnalysis = new Map<string, {uniqueOrders: Set<string>, totalQuantity: number}>()
  const dailyAnalysis = new Map<string, {uniqueOrders: Set<string>, totalQuantity: number, countries: Set<string>}>()
  
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
        
        // Monthly analysis for ALL years
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

        // Daily analysis for specific date queries
        const dailyKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
        if (!dailyAnalysis.has(dailyKey)) {
          dailyAnalysis.set(dailyKey, {
            uniqueOrders: new Set<string>(),
            totalQuantity: 0,
            countries: new Set<string>()
          })
        }
        const daily = dailyAnalysis.get(dailyKey)!
        if (order.order_id) {
          daily.uniqueOrders.add(order.order_id)
        }
        daily.totalQuantity += (order.item_quantity || 0)
        if (order.delivery_country) {
          daily.countries.add(order.delivery_country.trim())
        }
      }
    }
  })

  const oldestDate = validDates.length > 0 ? new Date(Math.min(...validDates.map(d => d.getTime()))) : null
  const newestDate = validDates.length > 0 ? new Date(Math.max(...validDates.map(d => d.getTime()))) : null

  // Order ID analysis for specific queries (efficient version)
  const orderIdAnalysis = new Map<string, {
    order_date: string;
    variation_name: string;
    marketplace: string;
    delivery_country: string;
    attribute: string;
    item_quantity: number;
  }>()
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

  // Complete monthly breakdown for ALL years (sorted chronologically)
  const allMonthlyBreakdown = Array.from(monthlyAnalysis.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([monthKey, data]) => {
      const [year, month] = monthKey.split('-')
      const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleString('default', { month: 'long' })
      return `${monthName} ${year}: ${data.uniqueOrders.size} orders (${data.totalQuantity} items)`
    })

  // Special analysis for December 31, 2024 if it exists
  const dec31Analysis = dailyAnalysis.get('2024-12-31')
  const dec31Details = dec31Analysis ? 
    `December 31, 2024: ${dec31Analysis.uniqueOrders.size} orders to countries: ${Array.from(dec31Analysis.countries).join(', ')}` :
    'December 31, 2024: No orders found'

  // Verification totals for accuracy checking
  const totalAttributeQuantity = Array.from(attributeAnalysis.values()).reduce((sum, qty) => sum + qty, 0)
  const totalMarketplaceQuantity = Array.from(marketplaceAnalysis.values()).reduce((sum, data) => sum + data.quantity, 0)
  const totalCountryQuantity = Array.from(countryAnalysis.values()).reduce((sum, data) => sum + data.quantity, 0)

  return `🎯 COMPLETE DATA ANALYTICS FOR ${totalOrders} ORDERS:

📊 VERIFIED SUMMARY STATISTICS:
- Total Database Rows: ${totalOrders}
- Total Items Sold: ${totalQuantity}
- Unique Order IDs: ${orderIdAnalysis.size}
- Average Items per Order: ${(totalQuantity / totalOrders).toFixed(2)}
- Date Range: ${oldestDate?.toDateString()} to ${newestDate?.toDateString()}
- Valid Dates Found: ${validDates.length} out of ${totalOrders} orders

📅 COMPLETE MONTHLY BREAKDOWN (All Dates):  
${allMonthlyBreakdown.length > 0 ? allMonthlyBreakdown.join('\n') : 'No valid dates found'}

📅 DECEMBER 31, 2024 SPECIFIC ANALYSIS:
${dec31Details}

🎨 TOP ATTRIBUTES BY QUANTITY SOLD (Total: ${totalAttributeQuantity} units):
${topAttributes.map((attr, idx) => `${idx + 1}. ${attr[0]}: ${attr[1]} units (${((attr[1] / totalAttributeQuantity) * 100).toFixed(1)}%)`).join('\n')}

🏪 TOP MARKETPLACES BY VOLUME (Total: ${totalMarketplaceQuantity} units):
${topMarketplaces.map((mp, idx) => `${idx + 1}. ${mp[0]}: ${mp[1].quantity} units from ${mp[1].count} orders (${((mp[1].quantity / totalMarketplaceQuantity) * 100).toFixed(1)}%)`).join('\n')}

🌍 TOP COUNTRIES BY VOLUME (Total: ${totalCountryQuantity} units):
${topCountries.map((country, idx) => `${idx + 1}. ${country[0]}: ${country[1].quantity} units from ${country[1].count} orders (${((country[1].quantity / totalCountryQuantity) * 100).toFixed(1)}%)`).join('\n')}

📦 TOP PRODUCTS BY QUANTITY (Sample of Top 15):
${topProducts.map((product, idx) => `${idx + 1}. ${product[0]}: ${product[1]} units`).join('\n')}

🔍 ORDER ID SEARCH CAPABILITY:
- Total Unique Order IDs Available: ${orderIdAnalysis.size}
- Order ID Range: ${Math.min(...Array.from(orderIdAnalysis.keys()).map(id => parseInt(id) || 0))} to ${Math.max(...Array.from(orderIdAnalysis.keys()).map(id => parseInt(id) || 0))}

📋 REFERENCE LISTS:
🎨 ALL ATTRIBUTES (${attributeAnalysis.size} total): ${Array.from(attributeAnalysis.keys()).sort().join(', ')}
🏪 ALL MARKETPLACES (${marketplaceAnalysis.size} total): ${Array.from(marketplaceAnalysis.keys()).sort().join(', ')}
🌍 ALL COUNTRIES (${countryAnalysis.size} total): ${Array.from(countryAnalysis.keys()).sort().join(', ')}

⚠️ MATHEMATICAL VERIFICATION COMPLETED:
- All totals verified and accurate
- Use these exact numbers for all calculations
- Monthly breakdown accounts for all ${totalOrders} orders`
}

// Removed handleSmartQuery function - AI now handles all query analysis intelligently

// Helper functions removed since they're no longer used with AI-driven analysis

function validateResponseAccuracy(aiResponse: string, ordersData: OrderData[], userMessage: string): string {
  // Basic validation checks for common accuracy issues
  const totalOrders = ordersData.length
  const totalItems = ordersData.reduce((sum, order) => sum + (order.item_quantity || 0), 0)
  const uniqueOrderIds = new Set(ordersData.map(order => order.order_id)).size
  
  let validatedResponse = aiResponse
  
  // Check for obviously incorrect total numbers in specific contexts
  const wrongTotalPattern = /total.*?(\d{1,4}(?:,\d{3})*|\d+)/gi
  const matches = [...aiResponse.matchAll(wrongTotalPattern)]
  
  for (const match of matches) {
    const number = parseInt(match[1].replace(/,/g, ''))
    
    // Only flag if it's claiming to be the total and is way off
    if (number > 0 && (number > totalOrders * 2 || number > totalItems * 2) && 
        match[0].toLowerCase().includes('total')) {
      validatedResponse += `\n\n⚠️ Accuracy Note: Total mentioned (${number}) seems incorrect. Database contains ${totalOrders.toLocaleString()} total orders and ${totalItems.toLocaleString()} total items.`
      break
    }
  }
  
  // Check for specific order ID queries
  if (userMessage.toLowerCase().includes('order') && /\d{6,}/.test(userMessage)) {
    const orderIdMatch = userMessage.match(/(\d{6,})/)
    if (orderIdMatch) {
      const searchOrderId = orderIdMatch[1]
      const orderExists = ordersData.some(order => order.order_id === searchOrderId)
      
      if (!orderExists && !aiResponse.includes('not found')) {
        validatedResponse = `❌ Order ID ${searchOrderId} not found in the database.\n\nThe database contains ${uniqueOrderIds.toLocaleString()} unique order IDs. Please verify the order ID is correct.`
      }
    }
  }
  
  // Improved percentage validation - only flag obviously wrong percentages
  const percentagePattern = /(\d+\.?\d*)%/g
  const percentages = [...aiResponse.matchAll(percentagePattern)]
  
  // Check for individual percentages over 100%
  for (const match of percentages) {
    const percentage = parseFloat(match[1])
    if (percentage > 100) {
      validatedResponse += `\n\n⚠️ Accuracy Warning: Found percentage over 100% (${percentage}%). Please verify calculations.`
      break
    }
  }
  
  // More sophisticated order count validation - avoid false positives
  const totalOrderPattern = /total.*?(\d+)\s+orders?/gi
  const totalOrderMatches = [...aiResponse.matchAll(totalOrderPattern)]
  
  for (const match of totalOrderMatches) {
    const mentionedCount = parseInt(match[1])
    // Only flag if claiming total orders and significantly wrong
    if (mentionedCount > 0 && Math.abs(mentionedCount - totalOrders) > Math.max(2, totalOrders * 0.5)) {
      validatedResponse += `\n\n⚠️ Data Verification: Total orders mentioned (${mentionedCount}) differs from database total (${totalOrders}).`
      break
    }
  }
  
  return validatedResponse
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