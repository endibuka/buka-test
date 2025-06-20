'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import DashboardLayout from '@/components/DashboardLayout'
import { chatStorage, ChatMessage, ChatSession } from '@/lib/chatStorage'
import { useChatContext } from '@/contexts/ChatContext'

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

export default function ChatPage() {
  const [orders, setOrders] = useState<OrderData[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [dataLoaded, setDataLoaded] = useState(false)
  const [welcomeShown, setWelcomeShown] = useState(false)
  const [dataLoadingMode, setDataLoadingMode] = useState<'all' | 'unique' | null>(null)
  const [dynamicSuggestions, setDynamicSuggestions] = useState<string[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { currentChatId, setCurrentChatId, setOnNewChat, setOnLoadChat, setCurrentChatTitle } = useChatContext()

  // Default suggested questions (shown initially)
  const defaultSuggestions = [
    "How many orders do we have?",
    "What is the most popular marketplace?", 
    "Show me orders from Germany",
    "What's the average order quantity?",
    "Which variation name appears most frequently?",
    "How many orders were placed in the last month?"
  ]

  // Use dynamic suggestions if available, otherwise show no suggestions for now
  const currentSuggestions = dynamicSuggestions.length > 0 ? dynamicSuggestions : (messages.length <= 1 ? defaultSuggestions : [])

  // Load orders data and setup chat context on component mount
  useEffect(() => {
    // Auto-load data immediately
    loadLastActiveChat()
    
    // Set up chat functions for header controls
    setOnNewChat(() => startNewChat)
    setOnLoadChat(() => loadChat)
  }, [])

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Save chat whenever messages change and we have a current chat
  useEffect(() => {
    if (messages.length > 0 && currentChatId) {
      saveChatToStorage()
    }
  }, [messages, currentChatId])

  // Update chat title when messages change
  useEffect(() => {
    if (messages.length > 0) {
      const title = chatStorage.generateChatTitle(messages)
      setCurrentChatTitle(title)
    } else {
      setCurrentChatTitle(null)
    }
  }, [messages, setCurrentChatTitle])

  // Update welcome message when data finishes loading
  useEffect(() => {
    if (dataLoaded && messages.length === 1 && messages[0]?.role === 'assistant' && messages[0]?.content.includes('currently loading')) {
      const updatedWelcomeMessage = {
        role: 'assistant' as const,
        content: `Hello! I've loaded ${orders.length} orders from your database. You can ask me questions about your orders data. Click on any suggestion below to get started:`,
        timestamp: new Date()
      }
      setMessages([updatedWelcomeMessage])
    }
  }, [dataLoaded, orders.length, messages])

  const loadOrdersData = async (mode: 'all' | 'unique' = 'all') => {
    try {
      setDataLoadingMode(mode)
      console.log(`Loading orders data with mode: ${mode}`)
      
      // Fetch all orders from Supabase using pagination to avoid limits
      let allOrders: any[] = []
      let from = 0
      const pageSize = 1000
      let hasMore = true

      while (hasMore) {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false })
          .range(from, from + pageSize - 1)

        if (error) {
          console.error('Error loading orders:', error)
          if (!welcomeShown) {
            setMessages(prev => [...prev, {
              role: 'assistant',
              content: 'Sorry, I couldn\'t load the orders data. Please make sure you have uploaded orders to Supabase first.',
              timestamp: new Date()
            }])
            setWelcomeShown(true)
          }
          return
        }

        if (data && data.length > 0) {
          allOrders = [...allOrders, ...data]
          from += pageSize
          hasMore = data.length === pageSize
          console.log(`Loaded ${data.length} orders from page ${from/pageSize}, total so far: ${allOrders.length}`)
        } else {
          hasMore = false
        }
      }

      console.log(`Total orders loaded from Supabase: ${allOrders.length}`)

      // If mode is 'unique', filter out duplicate order_ids
      let finalOrders = allOrders
      if (mode === 'unique') {
        const uniqueOrderIds = new Set()
        finalOrders = allOrders.filter(order => {
          if (uniqueOrderIds.has(order.order_id)) {
            return false
          }
          uniqueOrderIds.add(order.order_id)
          return true
        })
        console.log(`After filtering unique order_ids: ${finalOrders.length} unique orders`)
      }

      setOrders(finalOrders)
      setDataLoaded(true)
      
      // Always show the data count after loading
      const modeText = mode === 'unique' ? 'unique order IDs' : 'all orders'
      const countMessage = {
        role: 'assistant' as const,
        content: `✅ Data loaded successfully! I've loaded ${finalOrders.length} ${modeText} from your Supabase database. You can now ask me questions about your orders data.`,
        timestamp: new Date()
      }
      
      // Add the count message to the chat
      setMessages(prev => [...prev, countMessage])
      
      // Only show initial welcome if no active chat and not already shown
      if (!currentChatId && !welcomeShown && messages.length === 1) {
        setWelcomeShown(true)
      }
    } catch (error) {
      console.error('Error loading orders:', error)
      if (!welcomeShown) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'Error loading orders data. Please try again.',
          timestamp: new Date()
        }])
        setWelcomeShown(true)
      }
    }
  }

  const loadLastActiveChat = () => {
    const lastChatId = localStorage.getItem('lastActiveChatId')
    if (lastChatId) {
      loadChat(lastChatId)
    } else {
      // If no existing chat, auto-load CSV data immediately
      autoLoadCSVData()
    }
  }

  const autoLoadCSVData = async () => {
    try {
      console.log('Auto-loading CSV data...')
      
      // Show loading message
      setMessages([{
        role: 'assistant',
        content: '🔄 Loading your orders data automatically... Please wait.',
        timestamp: new Date()
      }])
      
      // Fetch CSV data from the API
      const response = await fetch('/api/fetch-orders')
      if (!response.ok) {
        throw new Error('Failed to fetch CSV data')
      }
      
      const data = await response.json()
      const csvOrders = data.orders || []
      
      console.log(`Auto-loaded ${csvOrders.length} orders from CSV`)
      
      setOrders(csvOrders)
      setDataLoaded(true)
      
      // Show success message with data count
      const successMessage = {
        role: 'assistant' as const,
        content: `✅ Data loaded successfully! I've loaded ${csvOrders.length} orders from your CSV file and pre-calculated all analysis functions. You can now ask me any questions about your orders data!`,
        timestamp: new Date()
      }
      
      setMessages([successMessage])
      setWelcomeShown(true)
      
    } catch (error) {
      console.error('Error auto-loading CSV data:', error)
      setMessages([{
        role: 'assistant',
        content: '❌ Error loading data automatically. Please try refreshing the page.',
        timestamp: new Date()
      }])
      setWelcomeShown(true)
    }
  }

  const saveChatToStorage = async () => {
    if (!currentChatId || messages.length === 0) return

    try {
      const title = chatStorage.generateChatTitle(messages)
      const chatSession: ChatSession = {
        id: currentChatId,
        title,
        messages,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      await chatStorage.saveChat(chatSession)
    } catch (error) {
      console.error('Error saving chat:', error)
    }
  }

  const loadChat = async (chatId: string) => {
    try {
      const chat = await chatStorage.getChat(chatId)
      if (chat) {
        // COMPLETE reset for fresh memory - clear all data first
        setOrders([])
        setDataLoaded(false)
        setDataLoadingMode(null)
        setDynamicSuggestions([])
        
        // Then load the chat
        setMessages(chat.messages)
        setCurrentChatId(chat.id)
        setCurrentChatTitle(chat.title)
        localStorage.setItem('lastActiveChatId', chat.id)
        
        // Force user to reload data for this chat session
        console.log('Chat loaded - data cleared for fresh analysis')
      }
    } catch (error) {
      console.error('Error loading chat:', error)
    }
  }

  const startNewChat = () => {
    console.log('Starting new chat with auto-loading...')
    
    // COMPLETE reset for fresh memory
    setOrders([])
    setDataLoaded(false)
    setDataLoadingMode(null)
    setDynamicSuggestions([])
    setWelcomeShown(false)
    
    const newChatId = chatStorage.generateChatId()
    setCurrentChatId(newChatId)
    setCurrentChatTitle(null)
    localStorage.setItem('lastActiveChatId', newChatId)

    // Auto-load CSV data immediately
    autoLoadCSVData()
    console.log('New chat started with auto-loading')
  }

  const handleSuggestionClick = async (suggestion: string) => {
    if (isLoading) return

    // Start new chat if none exists
    if (!currentChatId) {
      const newChatId = chatStorage.generateChatId()
      setCurrentChatId(newChatId)
      localStorage.setItem('lastActiveChatId', newChatId)
    }

    setIsLoading(true)

    // Add user message to chat
    setMessages(prev => [...prev, {
      role: 'user',
      content: suggestion,
      timestamp: new Date()
    }])

    try {
      console.log('Sending to chat API:', {
        message: suggestion,
        ordersDataLength: orders.length,
        sampleOrder: orders[0],
        orderIds: orders.slice(0, 10).map(o => o.order_id)
      })
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: suggestion,
          ordersData: orders
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get response from chatbot')
      }

      const data = await response.json()
      
      // Add assistant response to chat
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      }])

      // Update dynamic suggestions if provided
      if (data.suggestions && Array.isArray(data.suggestions)) {
        setDynamicSuggestions(data.suggestions)
      }
    } catch (error) {
      console.error('Error sending message:', error)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error while processing your request. Please try again.',
        timestamp: new Date()
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return
    
    console.log('sendMessage called with:', {
      inputMessage: inputMessage.trim(),
      ordersLength: orders.length,
      dataLoaded,
      sampleOrder: orders[0]
    })
    
    await handleSuggestionClick(inputMessage.trim())
    setInputMessage('')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col pr-6">
        {/* Chat Container */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col h-[calc(100vh-8rem)]" style={{ backgroundColor: 'var(--card)' }}>
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-2xl px-4 py-3 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-100 border border-blue-200 dark:border-blue-700'
                      : 'bg-gray-50 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600'
                  }`}
                  style={{ backgroundColor: message.role === 'user' ? undefined : 'var(--muted)' }}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p className={`text-xs mt-2 ${
                    message.role === 'user' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            

            
            {/* Show suggestions when data is loaded */}
            {dataLoaded && (
              <div className="flex justify-start">
                <div className="max-w-2xl">
                  <div className="grid grid-cols-1 gap-2 mt-4">
                    {currentSuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => handleSuggestionClick(suggestion)}
                        disabled={isLoading}
                        className="text-left px-4 py-2 text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {/* Show loading message when data is being loaded */}
            {dataLoadingMode !== null && !dataLoaded && (
              <div className="flex justify-start">
                <div className="max-w-2xl">
                  <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Loading orders data... Please wait.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-50 text-gray-800 dark:text-gray-200 px-4 py-3 rounded-lg thinking-border" 
                     style={{ backgroundColor: 'var(--muted)' }}>
                  <p className="text-sm text-blue-600 dark:text-blue-400">Thinking...</p>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-6">
            <div className="flex space-x-3">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={dataLoaded ? "Ask about your orders data..." : "Loading orders data..."}
                disabled={!dataLoaded || isLoading}
                className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 text-sm bg-white text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                style={{ backgroundColor: 'var(--background)' }}
              />
              <button
                onClick={sendMessage}
                disabled={!inputMessage.trim() || !dataLoaded || isLoading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:text-gray-500 dark:disabled:text-gray-400 text-white font-medium py-3 px-6 rounded-lg transition-colors text-sm"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
} 