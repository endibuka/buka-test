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
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { currentChatId, setCurrentChatId, setOnNewChat, setOnLoadChat } = useChatContext()

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

  const loadOrdersData = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading orders:', error)
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'Sorry, I couldn\'t load the orders data. Please make sure you have uploaded orders to Supabase first.',
          timestamp: new Date()
        }])
      } else {
        setOrders(data || [])
        setDataLoaded(true)
        if (!currentChatId) {
          // Only show welcome message if no active chat
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: `Hello! I've loaded ${data?.length || 0} orders from your database. You can ask me questions about your orders data. Here are some examples you can try:\n\n• "How many orders do we have?"\n• "What is the most popular marketplace?"\n• "Show me orders from Germany"\n• "What's the average order quantity?"\n• "Which variation name appears most frequently?"\n• "How many orders were placed in the last month?"`,
            timestamp: new Date()
          }])
        }
      }
    } catch (error) {
      console.error('Error loading orders:', error)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Error loading orders data. Please try again.',
        timestamp: new Date()
      }])
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
        localStorage.setItem('lastActiveChatId', chat.id)
      }
    } catch (error) {
      console.error('Error loading chat:', error)
    }
  }

  const startNewChat = () => {
    const newChatId = chatStorage.generateChatId()
    setCurrentChatId(newChatId)
    setMessages([])
    localStorage.setItem('lastActiveChatId', newChatId)

    // Add welcome message
    if (dataLoaded) {
      setMessages([{
        role: 'assistant',
        content: `Hello! I've loaded ${orders.length} orders from your database. You can ask me questions about your orders data. Here are some examples you can try:\n\n• "How many orders do we have?"\n• "What is the most popular marketplace?"\n• "Show me orders from Germany"\n• "What's the average order quantity?"\n• "Which variation name appears most frequently?"\n• "How many orders were placed in the last month?"`,
        timestamp: new Date()
      }])
    }
  }

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    // Start new chat if none exists
    if (!currentChatId) {
      const newChatId = chatStorage.generateChatId()
      setCurrentChatId(newChatId)
      localStorage.setItem('lastActiveChatId', newChatId)
    }

    const userMessage = inputMessage.trim()
    setInputMessage('')
    setIsLoading(true)

    // Add user message to chat
    setMessages(prev => [...prev, {
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    }])

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col">
        {/* Chat History Dropdown */}
        <div className="mb-4 relative">
          <div className="flex gap-3">
            <button
              onClick={() => setShowChatHistory(!showChatHistory)}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-sm"
            >
              <span className="text-gray-700 dark:text-gray-300">Chat History ({savedChats.length})</span>
              <ChevronDownIcon className={`h-4 w-4 text-gray-500 transition-transform ${showChatHistory ? 'rotate-180' : ''}`} />
            </button>
            
            <button
              onClick={startNewChat}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
            >
              <PlusIcon className="h-4 w-4" />
              New Chat
            </button>
          </div>

          {/* Chat History Dropdown */}
          {showChatHistory && (
            <div className="absolute top-full left-0 mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto">
              {savedChats.length === 0 ? (
                <div className="p-4 text-gray-500 dark:text-gray-400 text-sm">
                  No saved chats yet. Start a conversation to create your first chat!
                </div>
              ) : (
                savedChats.map((chat) => (
                  <div
                    key={chat.id}
                    className={`p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0 flex justify-between items-start ${
                      currentChatId === chat.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                    onClick={() => {
                      loadChat(chat.id)
                      setShowChatHistory(false)
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {chat.title}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {chat.messages.length} messages • {chat.updatedAt.toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={(e) => deleteChat(chat.id, e)}
                      className="ml-2 p-1 text-gray-400 hover:text-red-500 transition-colors"
                      title="Delete chat"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Current Chat Title */}
        {currentChatId && messages.length > 0 && (
          <div className="mb-4 px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              {chatStorage.generateChatTitle(messages)}
            </h2>
          </div>
        )}

        {/* Chat Container */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col h-[calc(100vh-12rem)]" style={{ backgroundColor: 'var(--card)' }}>
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
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-50 text-gray-800 dark:text-gray-200 px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-600" style={{ backgroundColor: 'var(--muted)' }}>
                  <p className="text-sm">Thinking...</p>
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