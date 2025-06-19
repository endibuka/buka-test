'use client'

import { useState, useEffect } from 'react'
import { ChevronDownIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline'
import { chatStorage, ChatSession } from '@/lib/chatStorage'

interface ChatControlsProps {
  onNewChat: () => void
  onLoadChat: (chatId: string) => void
  currentChatId: string | null
}

export default function ChatControls({ onNewChat, onLoadChat, currentChatId }: ChatControlsProps) {
  const [savedChats, setSavedChats] = useState<ChatSession[]>([])
  const [showChatHistory, setShowChatHistory] = useState(false)

  useEffect(() => {
    loadChatHistory()
  }, [])

  const loadChatHistory = async () => {
    try {
      const chats = await chatStorage.getAllChats()
      setSavedChats(chats)
    } catch (error) {
      console.error('Error loading chat history:', error)
    }
  }

  const deleteChat = async (chatId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    try {
      await chatStorage.deleteChat(chatId)
      await loadChatHistory()
      
      if (currentChatId === chatId) {
        onNewChat()
      }
    } catch (error) {
      console.error('Error deleting chat:', error)
    }
  }

  const handleLoadChat = (chatId: string) => {
    onLoadChat(chatId)
    setShowChatHistory(false)
  }

  const handleNewChat = () => {
    onNewChat()
    setShowChatHistory(false)
  }

  // Refresh chat list when needed
  useEffect(() => {
    const refreshInterval = setInterval(loadChatHistory, 5000)
    return () => clearInterval(refreshInterval)
  }, [])

  return (
    <div className="relative">
      <div className="flex gap-2">
        <button
          onClick={() => setShowChatHistory(!showChatHistory)}
          className="flex items-center gap-1 px-3 py-1.5 text-xs bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
        >
          <span className="text-gray-700 dark:text-gray-300">History ({savedChats.length})</span>
          <ChevronDownIcon className={`h-3 w-3 text-gray-500 transition-transform ${showChatHistory ? 'rotate-180' : ''}`} />
        </button>
        
        <button
          onClick={handleNewChat}
          className="flex items-center gap-1 px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
        >
          <PlusIcon className="h-3 w-3" />
          New
        </button>
      </div>

      {/* Chat History Dropdown */}
      {showChatHistory && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
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
                onClick={() => handleLoadChat(chat.id)}
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
  )
} 