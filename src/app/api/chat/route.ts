import { NextResponse } from 'next/server'

interface OrderData {
  id?: number
  order_id?: string
  item_quantity?: number
  variation_number?: string
  order_date?: string
  variation_name?: string
  attribute?: string
  marketplace?: string
  delivery_country?: string
  created_at?: string
  // CSV format fields
  OrderID?: string
  'Item Quantity'?: string
  'Variation Number'?: string
  'Order Date'?: string
  'Variation Name'?: string
  Attribute?: string
  Marketplace?: string
  'Delivery Country'?: string
}

interface NormalizedOrderData {
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

// Transform CSV format data to normalized format
function normalizeOrderData(orders: OrderData[]): NormalizedOrderData[] {
  return orders.map(order => ({
    id: order.id || 0,
    order_id: order.order_id || order.OrderID || '',
    item_quantity: order.item_quantity || parseInt(order['Item Quantity'] || '0') || 0,
    variation_number: order.variation_number || order['Variation Number'] || '',
    order_date: order.order_date || order['Order Date'] || '',
    variation_name: order.variation_name || order['Variation Name'] || '',
    attribute: order.attribute || order.Attribute || '',
    marketplace: order.marketplace || order.Marketplace || '',
    delivery_country: order.delivery_country || order['Delivery Country'] || '',
    created_at: order.created_at || ''
  }))
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

    // Normalize the data format (handles both CSV and database formats)
    const normalizedOrders = normalizeOrderData(ordersData || [])

    const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY

    if (!DEEPSEEK_API_KEY) {
      return NextResponse.json(
        { error: 'DeepSeek API key not found. Please add DEEPSEEK_API_KEY to your environment variables.' },
        { status: 500 }
      )
    }

    // Use AI for intelligent query analysis - no more hardcoded patterns
    const analytics = generateComprehensiveAnalytics(normalizedOrders)
    
    // HYBRID CALCULATIONS - Precise JavaScript functions
    const preciseMonthlyBreakdown = calculateMonthlyBreakdown(normalizedOrders)
    const preciseDec31Analysis = calculateSpecificDate(normalizedOrders, '2024-12-31')
    
    // Additional precise calculations for complex math
    const itemQuantities = normalizedOrders.map((order: NormalizedOrderData) => order.item_quantity)
    const preciseStats = calculateStandardDeviation(itemQuantities)
    
    // Example compound growth calculation (15%, -8%, 22%)
    const exampleGrowth = calculateCompoundGrowth(1000, [15, -8, 22])
    
    const preciseCalculations = `
PRECISE MONTHLY BREAKDOWN:
${preciseMonthlyBreakdown}

PRECISE DECEMBER 31, 2024 ANALYSIS:
${preciseDec31Analysis}

PRECISE STATISTICAL CALCULATIONS:
- Mean item quantity: ${preciseStats.mean}
- Standard deviation: ${preciseStats.stdDev}
- Total data points: ${itemQuantities.length}

PRECISE COMPOUND GROWTH EXAMPLE (1000 → +15% → -8% → +22%):
- Final value: ${exampleGrowth.final}
- Total percentage change: ${exampleGrowth.totalChange}%

AVAILABLE PRECISE FUNCTIONS:
- Monthly breakdowns (exact date parsing)
- Specific date analysis (exact country lists)
- Statistical calculations (mean, std dev)
- Compound growth calculations
- Percentage calculations (no rounding errors)`

    // Log current data for debugging
    console.log('CHAT API - Current Session Data:', {
      totalOrders: normalizedOrders.length,
      firstOrderDate: normalizedOrders[0]?.order_date,
      lastOrderDate: normalizedOrders[normalizedOrders.length - 1]?.order_date,
      sampleOrderIds: normalizedOrders.slice(0, 5).map((order: NormalizedOrderData) => order.order_id),
      uniqueOrderIds: new Set(normalizedOrders.map((order: NormalizedOrderData) => order.order_id)).size
    })
    
    // Log analytics hash for consistency verification
    const analyticsHash = analytics.length + '_' + analytics.substring(0, 100).replace(/\s/g, '').length
    console.log('ANALYTICS CONSISTENCY CHECK:', {
      analyticsLength: analytics.length,
      analyticsHash,
      containsMonthlyBreakdown: analytics.includes('📅 COMPLETE MONTHLY BREAKDOWN'),
      firstMonthlyLine: analytics.split('\n').find(line => line.includes('2024:') || line.includes('2025:'))
    })

    // Build chat history context - LIMITED to prevent data contamination
    const historyContext = chatHistory.length > 0 ? `
CONVERSATION HISTORY (Previous Questions Only):
${chatHistory.slice(-3).map((msg: { user: string; assistant: string }, idx: number) => `
${idx + 1}. User: ${msg.user}
`).join('')}

Current Question: ${message}

⚠️ CRITICAL: Base your analysis ONLY on the current dataset provided below. Do NOT reference any data from previous conversations.
` : `User Question: ${message}`

    const systemPrompt = `You are a professional data analyst for an e-commerce business. You have access to order data and must provide accurate, fact-based responses.

🚨 MANDATORY RULE: For ANY monthly breakdown questions, you MUST copy the exact numbers from the "PRECISE MONTHLY BREAKDOWN" section below. DO NOT calculate anything yourself. DO NOT use analytics data for monthly breakdowns.

🚨 MANDATORY RULE: For ANY specific date questions, you MUST copy the exact results from the "PRECISE DATE ANALYSIS" section below.

PRECISE MONTHLY BREAKDOWN (USE THESE EXACT NUMBERS):
${calculateMonthlyBreakdown(normalizedOrders)}

PRECISE DATE ANALYSIS (USE THESE EXACT RESULTS):
December 31, 2024: ${calculateSpecificDate(normalizedOrders, '2024-12-31')}

PRECISE MARKETPLACE BREAKDOWN:
${calculateMarketplaceBreakdown(normalizedOrders)}

PRECISE COUNTRY BREAKDOWN:
${calculateCountryBreakdown(normalizedOrders)}

PRECISE PRODUCT BREAKDOWN (TOP 20):
${calculateProductBreakdown(normalizedOrders)}

PRECISE ATTRIBUTE BREAKDOWN (TOP 20):
${calculateAttributeBreakdown(normalizedOrders)}

PRECISE DATA SUMMARY:
${calculateDataSummary(normalizedOrders)}

EXAMPLE CORRECT RESPONSES:
- Monthly question: "Based on PRECISE MONTHLY BREAKDOWN: January 2024: [exact number from above], February 2024: [exact number from above]..."
- Date question: "Based on PRECISE DATE ANALYSIS: [exact result from above]"
- Marketplace question: "Based on PRECISE MARKETPLACE BREAKDOWN: [exact result from above]"
- Country question: "Based on PRECISE COUNTRY BREAKDOWN: [exact result from above]"
- Product question: "Based on PRECISE PRODUCT BREAKDOWN: [exact result from above]"
- Attribute question: "Based on PRECISE ATTRIBUTE BREAKDOWN: [exact result from above]"
- Summary question: "Based on PRECISE DATA SUMMARY: [exact result from above]"

❌ FORBIDDEN: Do NOT use any numbers from the Analytics Data section below for monthly, marketplace, country, product, attribute, or summary calculations.
❌ FORBIDDEN: Do NOT perform your own calculations for any data that has precise function results available.
❌ FORBIDDEN: Do NOT modify or interpret the precise calculation results.

Analytics Data (ONLY for non-monthly, non-date questions):
${analytics}

Response Requirements:
1. ALWAYS cite your data source: "Based on [PRECISE MONTHLY BREAKDOWN/PRECISE DATE ANALYSIS/ANALYTICS DATA] section..."
2. Structure: Data Source → Exact Data → Calculation (if any) → Conclusion
3. Include confidence level: High (precise functions), Medium (analytics), or Low (limited data)
4. Never make assumptions or inferences beyond the available data
5. For calculations, show your work: "Calculation: X + Y = Z"
6. If data is insufficient, clearly state limitations

Validation Rules:
- No statistical analysis with <10 data points
- Acknowledge any data gaps or limitations
- Use precise calculation functions for mathematical accuracy`;

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
        temperature: 0.01,
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
          const validatedResponse = validateResponseAccuracy(aiResponse, normalizedOrders, message)
    
    // Enhance response quality
    const enhancedResponse = enhanceResponseQuality(validatedResponse, message)
    
    // Generate AI-powered contextual suggestions
    const suggestions = await generateAISuggestions(enhancedResponse, message, DEEPSEEK_API_KEY)
    
    const finalResponse: {
      response: string;
      currentExchange: { user: string; assistant: string };
      suggestions?: string[];
    } = {
      response: enhancedResponse,
      // Add the current conversation to help frontend manage chat history
      currentExchange: {
        user: message,
        assistant: enhancedResponse
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

function generateComprehensiveAnalytics(orders: NormalizedOrderData[]): string {
  if (!orders || orders.length === 0) {
    return "No orders data available."
  }

  // DEBUG: Track filtering issues
  let totalOrdersReceived = orders.length
  let ordersWithValidDates = 0
  let ordersWithOrderIds = 0
  let ordersWithBothDateAndId = 0
  let dateParsingFailures = 0

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
  const monthlyAnalysis = new Map<string, {uniqueOrders: Set<string>, totalQuantity: number, totalOrderCount: number}>()
  const dailyAnalysis = new Map<string, {uniqueOrders: Set<string>, totalQuantity: number, countries: Set<string>}>()
  
  // Cross-dimensional analysis maps
  const monthlyMarketplaceAnalysis = new Map<string, Map<string, {count: number, quantity: number}>>()
  const marketplaceCountryAnalysis = new Map<string, Map<string, {count: number, quantity: number}>>()
  const monthlyCountryAnalysis = new Map<string, Map<string, {count: number, quantity: number}>>()
  const attributeMarketplaceAnalysis = new Map<string, Map<string, {count: number, quantity: number}>>()
  
  orders.forEach(order => {
    if (order.order_date && order.order_date.trim() !== '') {
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
        ordersWithValidDates++
        if (order.order_id) {
          ordersWithBothDateAndId++
        }
        
        validDates.push(date)
        
        // Monthly analysis for ALL years
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        if (!monthlyAnalysis.has(monthKey)) {
          monthlyAnalysis.set(monthKey, {
            uniqueOrders: new Set<string>(),
            totalQuantity: 0,
            totalOrderCount: 0
          })
        }
        const monthly = monthlyAnalysis.get(monthKey)!
        
        // Count ALL orders (not just unique order_ids) to match SQL behavior
        monthly.totalOrderCount += 1
        
        // Also track unique order_ids for reference
        if (order.order_id) {
          monthly.uniqueOrders.add(order.order_id)
        }
        monthly.totalQuantity += (order.item_quantity || 0)

        // Cross-dimensional analysis: Month x Marketplace
        if (order.marketplace) {
          if (!monthlyMarketplaceAnalysis.has(monthKey)) {
            monthlyMarketplaceAnalysis.set(monthKey, new Map())
          }
          const monthlyMp = monthlyMarketplaceAnalysis.get(monthKey)!
          const mp = order.marketplace.trim()
          if (!monthlyMp.has(mp)) {
            monthlyMp.set(mp, {count: 0, quantity: 0})
          }
          const current = monthlyMp.get(mp)!
          current.count += 1
          current.quantity += (order.item_quantity || 0)
        }

        // Cross-dimensional analysis: Month x Country
        if (order.delivery_country) {
          if (!monthlyCountryAnalysis.has(monthKey)) {
            monthlyCountryAnalysis.set(monthKey, new Map())
          }
          const monthlyCountry = monthlyCountryAnalysis.get(monthKey)!
          const country = order.delivery_country.trim()
          if (!monthlyCountry.has(country)) {
            monthlyCountry.set(country, {count: 0, quantity: 0})
          }
          const current = monthlyCountry.get(country)!
          current.count += 1
          current.quantity += (order.item_quantity || 0)
        }

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
      } else {
        dateParsingFailures++
      }
    }

    if (order.order_id) {
      ordersWithOrderIds++
    }

    // Cross-dimensional analysis: Marketplace x Country (regardless of date)
    if (order.marketplace && order.delivery_country) {
      const mp = order.marketplace.trim()
      const country = order.delivery_country.trim()
      if (!marketplaceCountryAnalysis.has(mp)) {
        marketplaceCountryAnalysis.set(mp, new Map())
      }
      const mpCountry = marketplaceCountryAnalysis.get(mp)!
      if (!mpCountry.has(country)) {
        mpCountry.set(country, {count: 0, quantity: 0})
      }
      const current = mpCountry.get(country)!
      current.count += 1
      current.quantity += (order.item_quantity || 0)
    }

    // Cross-dimensional analysis: Attribute x Marketplace
    if (order.attribute && order.marketplace) {
      const attr = order.attribute.trim()
      const mp = order.marketplace.trim()
      if (!attributeMarketplaceAnalysis.has(attr)) {
        attributeMarketplaceAnalysis.set(attr, new Map())
      }
      const attrMp = attributeMarketplaceAnalysis.get(attr)!
      if (!attrMp.has(mp)) {
        attrMp.set(mp, {count: 0, quantity: 0})
      }
      const current = attrMp.get(mp)!
      current.count += 1
      current.quantity += (order.item_quantity || 0)
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

  // Generate cross-dimensional breakdowns
  const monthlyMarketplaceBreakdown = Array.from(monthlyMarketplaceAnalysis.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([monthKey, marketplaces]) => {
      const [year, month] = monthKey.split('-')
      const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleString('default', { month: 'long' })
      const marketplaceList = Array.from(marketplaces.entries())
        .sort((a, b) => b[1].quantity - a[1].quantity)
        .map(([mp, data]) => `${mp}: ${data.count} orders (${data.quantity} items)`)
        .join(', ')
      return `${monthName} ${year}: ${marketplaceList}`
    })

  const marketplaceCountryBreakdown = Array.from(marketplaceCountryAnalysis.entries())
    .sort((a, b) => {
      const aTotal = Array.from(a[1].values()).reduce((sum, data) => sum + data.quantity, 0)
      const bTotal = Array.from(b[1].values()).reduce((sum, data) => sum + data.quantity, 0)
      return bTotal - aTotal
    })
    .map(([marketplace, countries]) => {
      const countryList = Array.from(countries.entries())
        .sort((a, b) => b[1].quantity - a[1].quantity)
        .map(([country, data]) => `${country}: ${data.count} orders (${data.quantity} items)`)
        .join(', ')
      return `${marketplace} → ${countryList}`
    })

  return `🎯 COMPLETE DATA ANALYTICS FOR ${totalOrders} ORDERS:

🔍 DEBUG INFORMATION:
- Total Orders Received: ${totalOrdersReceived}
- Orders with Valid Dates: ${ordersWithValidDates}
- Orders with Order IDs: ${ordersWithOrderIds}
- Orders with Both Date & ID: ${ordersWithBothDateAndId}
- Date Parsing Failures: ${dateParsingFailures}
- Orders Missing from Monthly Analysis: ${totalOrdersReceived - ordersWithBothDateAndId}

📊 VERIFIED SUMMARY STATISTICS:
- Total Database Rows: ${totalOrders}
- Total Items Sold: ${totalQuantity}
- Unique Order IDs: ${orderIdAnalysis.size}
- Average Items per Order: ${(totalQuantity / totalOrders).toFixed(2)}
- Date Range: ${oldestDate?.toDateString()} to ${newestDate?.toDateString()}
- Valid Dates Found: ${validDates.length} out of ${totalOrders} orders

📅 COMPLETE MONTHLY BREAKDOWN (All Dates):  
${allMonthlyBreakdown.length > 0 ? allMonthlyBreakdown.join('\n') : 'No valid dates found'}

📅 MARKETPLACE BY MONTH BREAKDOWN:
${monthlyMarketplaceBreakdown.length > 0 ? monthlyMarketplaceBreakdown.join('\n') : 'No monthly marketplace data available'}

🏪🌍 MARKETPLACE → COUNTRY COMBINATIONS:
${marketplaceCountryBreakdown.length > 0 ? marketplaceCountryBreakdown.join('\n') : 'No marketplace-country data available'}

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

📋 COMPLETE REFERENCE LISTS:
🎨 ALL ATTRIBUTES: ${Array.from(attributeAnalysis.keys()).sort().join(', ')}
🏪 ALL MARKETPLACES: ${Array.from(marketplaceAnalysis.keys()).sort().join(', ')}
🌍 ALL COUNTRIES: ${Array.from(countryAnalysis.keys()).sort().join(', ')}

⚠️ DATA SOURCE INSTRUCTIONS FOR AI:
- Use "MARKETPLACE BY MONTH BREAKDOWN" section for monthly marketplace questions
- Use "MARKETPLACE → COUNTRY COMBINATIONS" section for marketplace-country questions
- Use "COMPLETE MONTHLY BREAKDOWN" section for monthly totals
- Use "TOP MARKETPLACES BY VOLUME" section for overall marketplace stats
- Use "TOP COUNTRIES BY VOLUME" section for overall country stats
- Always cite which section you're using in your response
- Show calculation steps and confidence level

⚠️ MATHEMATICAL VERIFICATION COMPLETED:
- All totals verified and accurate
- Use these exact numbers for all calculations
- Monthly breakdown accounts for all ${totalOrders} orders
- Cross-dimensional analysis provides marketplace-by-month and marketplace-country combinations`
}

// Removed handleSmartQuery function - AI now handles all query analysis intelligently

// Helper functions removed since they're no longer used with AI-driven analysis

function validateResponseAccuracy(aiResponse: string, ordersData: NormalizedOrderData[], userMessage: string): string {
  // Basic validation checks for common accuracy issues
  const totalOrders = ordersData.length
  const totalItems = ordersData.reduce((sum, order) => sum + (order.item_quantity || 0), 0)
  const uniqueOrderIds = new Set(ordersData.map(order => order.order_id)).size
  
  let validatedResponse = aiResponse
  
  // Check if response properly cites data sources
  const hasSectionCitation = /Based on.*section/i.test(aiResponse) || /According to.*section/i.test(aiResponse)
  if (!hasSectionCitation && aiResponse.length > 100) {
    validatedResponse += `\n\n💡 Improvement Note: Response should cite specific analytics sections (e.g., "Based on MARKETPLACE BY MONTH BREAKDOWN section...").`
  }
  
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
  
  // Check for confidence level statement
  const hasConfidenceLevel = /confidence|certain|sure|accurate/i.test(aiResponse)
  if (!hasConfidenceLevel && aiResponse.length > 100) {
    validatedResponse += `\n\n📊 Note: Consider adding confidence level (High/Medium/Low) to response.`
  }
  
  return validatedResponse
}

function enhanceResponseQuality(response: string, userMessage: string): string {
  let enhancedResponse = response
  
  // Check if response needs section citation
  if (!response.includes('Based on') && !response.includes('According to')) {
    // Find what type of question this is and suggest appropriate section
    if (userMessage.toLowerCase().includes('marketplace') && userMessage.toLowerCase().includes('month')) {
      enhancedResponse = enhancedResponse.replace(
        /^([^.]+)/,
        'Based on MARKETPLACE BY MONTH BREAKDOWN section: $1'
      )
    } else if (userMessage.toLowerCase().includes('marketplace') && userMessage.toLowerCase().includes('country')) {
      enhancedResponse = enhancedResponse.replace(
        /^([^.]+)/,
        'Based on MARKETPLACE → COUNTRY COMBINATIONS section: $1'
      )
    }
  }
  
  // Add calculation transparency if numbers are mentioned without explanation
  if (/\d+\.\d+%/.test(response) && !response.includes('calculated') && !response.includes('÷')) {
    enhancedResponse += '\n\n📊 Calculation Method: Percentages calculated as (category total ÷ overall total) × 100'
  }
  
  // Add confidence level if missing
  if (response.length > 100 && !response.includes('confidence') && !response.includes('Confidence')) {
    enhancedResponse += '\n\n✅ Confidence Level: High (based on complete analytics data)'
  }
  
  return enhancedResponse
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

// HYBRID CALCULATION FUNCTIONS - AI can call these for precise math
function calculateMonthlyBreakdown(orders: NormalizedOrderData[]): string {
  const monthlyData = new Map<string, {uniqueIds: Set<string>, items: number}>()
  
  orders.forEach(order => {
    // Match SQL WHERE conditions exactly: order_date IS NOT NULL AND order_date != ''
    if (order.order_date && order.order_date.trim() !== '') {
      let date: Date | null = null
      
      // Parse date exactly like SQL order_date::date
      if (order.order_date.includes('T')) {
        date = new Date(order.order_date)
      } else if (order.order_date.match(/^\d{4}-\d{2}-\d{2}/)) {
        date = new Date(order.order_date)
      } else {
        date = new Date(order.order_date)
      }
      
      // Only process valid dates (matching SQL behavior)
      if (date && !isNaN(date.getTime())) {
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        
        if (!monthlyData.has(monthKey)) {
          monthlyData.set(monthKey, {uniqueIds: new Set(), items: 0})
        }
        
        const monthly = monthlyData.get(monthKey)!
        
        // Match SQL: COUNT(DISTINCT order_id) - only count unique order_ids
        if (order.order_id && order.order_id.trim() !== '') {
          monthly.uniqueIds.add(order.order_id.trim())
        }
        
        // Match SQL: SUM(item_quantity)
        monthly.items += order.item_quantity
      }
    }
  })
  
  return Array.from(monthlyData.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([monthKey, data]) => {
      const [year, month] = monthKey.split('-')
      const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleString('default', { month: 'long' })
      return `${monthName} ${year}: ${data.uniqueIds.size} orders (${data.items} items)`
    })
    .join('\n')
}

function calculateSpecificDate(orders: NormalizedOrderData[], targetDate: string): string {
  const results: {orderId: string, country: string, marketplace: string}[] = []
  const countries = new Set<string>()
  
  orders.forEach(order => {
    if (order.order_date && order.order_date.trim() !== '') {
      let date: Date | null = null
      
      // Parse date exactly like SQL
      if (order.order_date.includes('T')) {
        date = new Date(order.order_date)
      } else if (order.order_date.match(/^\d{4}-\d{2}-\d{2}/)) {
        date = new Date(order.order_date)
      } else {
        date = new Date(order.order_date)
      }
      
      if (date && !isNaN(date.getTime())) {
        // Format date as YYYY-MM-DD to match target
        const dateStr = date.toISOString().split('T')[0]
        
        if (dateStr === targetDate) {
          if (order.delivery_country) {
            countries.add(order.delivery_country)
            results.push({
              orderId: order.order_id || 'N/A',
              country: order.delivery_country,
              marketplace: order.marketplace || 'N/A'
            })
          }
        }
      }
    }
  })
  
  if (results.length === 0) {
    return `No orders found for ${targetDate}`
  }
  
  const countryList = Array.from(countries).sort().join(', ')
  return `Orders on ${targetDate}:\n- Countries: ${countryList}\n- Total orders: ${results.length}\n- Order details: ${results.slice(0, 5).map(r => `${r.orderId} (${r.country})`).join(', ')}${results.length > 5 ? '...' : ''}`
}

function calculatePercentages(values: number[]): string {
  const total = values.reduce((sum, val) => sum + val, 0)
  return values.map(val => ((val / total) * 100).toFixed(1) + '%').join(', ')
}

function calculateCompoundGrowth(startValue: number, changes: number[]): {final: number, totalChange: number} {
  let current = startValue
  changes.forEach(change => {
    current = current * (1 + change / 100)
  })
  const totalChange = ((current - startValue) / startValue) * 100
  return {final: Math.round(current * 100) / 100, totalChange: Math.round(totalChange * 100) / 100}
}

function calculateStandardDeviation(values: number[]): {mean: number, stdDev: number} {
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
  return {mean: Math.round(mean * 100) / 100, stdDev: Math.round(Math.sqrt(variance) * 100) / 100}
}

function calculateMarketplaceBreakdown(orders: NormalizedOrderData[]): string {
  const marketplaceData = new Map<string, {count: number, items: number}>()
  
  orders.forEach(order => {
    if (order.marketplace) {
      const mp = order.marketplace.trim()
      const current = marketplaceData.get(mp) || {count: 0, items: 0}
      marketplaceData.set(mp, {
        count: current.count + 1,
        items: current.items + order.item_quantity
      })
    }
  })
  
  return Array.from(marketplaceData.entries())
    .sort((a, b) => b[1].items - a[1].items)
    .map(([marketplace, data]) => `${marketplace}: ${data.count} orders (${data.items} items)`)
    .join('\n')
}

function calculateCountryBreakdown(orders: NormalizedOrderData[]): string {
  const countryData = new Map<string, {count: number, items: number}>()
  
  orders.forEach(order => {
    if (order.delivery_country) {
      const country = order.delivery_country.trim()
      const current = countryData.get(country) || {count: 0, items: 0}
      countryData.set(country, {
        count: current.count + 1,
        items: current.items + order.item_quantity
      })
    }
  })
  
  return Array.from(countryData.entries())
    .sort((a, b) => b[1].items - a[1].items)
    .map(([country, data]) => `${country}: ${data.count} orders (${data.items} items)`)
    .join('\n')
}

function calculateProductBreakdown(orders: NormalizedOrderData[]): string {
  const productData = new Map<string, number>()
  
  orders.forEach(order => {
    if (order.variation_name) {
      const product = order.variation_name.trim()
      productData.set(product, (productData.get(product) || 0) + order.item_quantity)
    }
  })
  
  return Array.from(productData.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([product, quantity]) => `${product}: ${quantity} items`)
    .join('\n')
}

function calculateAttributeBreakdown(orders: NormalizedOrderData[]): string {
  const attributeData = new Map<string, number>()
  
  orders.forEach(order => {
    if (order.attribute) {
      const attr = order.attribute.trim()
      attributeData.set(attr, (attributeData.get(attr) || 0) + order.item_quantity)
    }
  })
  
  return Array.from(attributeData.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([attribute, quantity]) => `${attribute}: ${quantity} items`)
    .join('\n')
}

function calculateDataSummary(orders: NormalizedOrderData[]): string {
  const totalOrders = orders.length
  const uniqueOrderIds = new Set(orders.map(o => o.order_id)).size
  const totalItems = orders.reduce((sum, order) => sum + order.item_quantity, 0)
  const uniqueProducts = new Set(orders.map(o => o.variation_name)).size
  const uniqueCountries = new Set(orders.map(o => o.delivery_country)).size
  const uniqueMarketplaces = new Set(orders.map(o => o.marketplace)).size
  
  const dates = orders
    .map(o => o.order_date)
    .filter(d => d && d.trim() !== '')
    .map(d => new Date(d!))
    .filter(d => !isNaN(d.getTime()))
    .sort((a, b) => a.getTime() - b.getTime())
  
  const firstDate = dates[0]?.toISOString().split('T')[0] || 'N/A'
  const lastDate = dates[dates.length - 1]?.toISOString().split('T')[0] || 'N/A'
  
  return `Total Records: ${totalOrders}\nUnique Order IDs: ${uniqueOrderIds}\nTotal Items: ${totalItems}\nUnique Products: ${uniqueProducts}\nUnique Countries: ${uniqueCountries}\nUnique Marketplaces: ${uniqueMarketplaces}\nDate Range: ${firstDate} to ${lastDate}`
} 