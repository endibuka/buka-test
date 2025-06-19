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
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { currentChatId, setCurrentChatId, setOnNewChat, setOnLoadChat, setCurrentChatTitle } = useChatContext()

  // Suggested questions
  const suggestions = [
    "How many orders do we have?",
    "What is the most popular marketplace?", 
    "Show me orders from Germany",
    "What's the average order quantity?",
    "Which variation name appears most frequently?",
    "How many orders were placed in the last month?"
  ]

  // Load orders data and setup chat context on component mount
  useEffect(() => {
    loadOrdersData()
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

  const loadOrdersData = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })

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
      } else {
        setOrders(data || [])
        setDataLoaded(true)
        // Only show welcome message if no active chat and not already shown
        if (!currentChatId && !welcomeShown && messages.length === 0) {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: `Hello! I've loaded ${data?.length || 0} orders from your database. You can ask me questions about your orders data. Click on any suggestion below to get started:`,
            timestamp: new Date()
          }])
          setWelcomeShown(true)
        }
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
        setMessages(chat.messages)
        setCurrentChatId(chat.id)
        setCurrentChatTitle(chat.title)
        localStorage.setItem('lastActiveChatId', chat.id)
      }
    } catch (error) {
      console.error('Error loading chat:', error)
    }
  }

  const startNewChat = () => {
    console.log('Starting new chat...', { dataLoaded, ordersLength: orders.length, welcomeShown })
    
    const newChatId = chatStorage.generateChatId()
    setCurrentChatId(newChatId)
    setCurrentChatTitle(null)
    setWelcomeShown(false)
    localStorage.setItem('lastActiveChatId', newChatId)

    // Always show a welcome message, regardless of data state
    let welcomeContent: string
    if (dataLoaded && orders.length > 0) {
      welcomeContent = `Hello! I've loaded ${orders.length} orders from your database. You can ask me questions about your orders data. Click on any suggestion below to get started:`
    } else {
      welcomeContent = `Hello! Welcome to the chat tool. I'm currently loading your orders data. Please wait a moment and then you can ask questions about your orders.`
    }

    const welcomeMessage = {
      role: 'assistant' as const,
      content: welcomeContent,
      timestamp: new Date()
    }
    
    console.log('Setting welcome message:', welcomeMessage)
    setMessages([welcomeMessage])
    setWelcomeShown(true)
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
            
            {/* Show suggestions when there's just the welcome message and either data is loaded or we're showing the loading message */}
            {messages.length === 1 && messages[0]?.role === 'assistant' && (
              <div className="flex justify-start">
                <div className="max-w-2xl">
                  {dataLoaded ? (
                    <div className="grid grid-cols-1 gap-2 mt-4">
                      {suggestions.map((suggestion, index) => (
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
                  ) : (
                    <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Loading orders data... Please wait.</p>
                    </div>
                  )}
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