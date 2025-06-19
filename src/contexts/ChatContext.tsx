'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

interface ChatContextType {
  currentChatId: string | null
  setCurrentChatId: (id: string | null) => void
  onNewChat: (() => void) | null
  setOnNewChat: (fn: () => void) => void
  onLoadChat: ((chatId: string) => void) | null
  setOnLoadChat: (fn: (chatId: string) => void) => void
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

export function ChatProvider({ children }: { children: ReactNode }) {
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  const [onNewChat, setOnNewChat] = useState<(() => void) | null>(null)
  const [onLoadChat, setOnLoadChat] = useState<((chatId: string) => void) | null>(null)

  return (
    <ChatContext.Provider value={{
      currentChatId,
      setCurrentChatId,
      onNewChat,
      setOnNewChat,
      onLoadChat,
      setOnLoadChat
    }}>
      {children}
    </ChatContext.Provider>
  )
}

export function useChatContext() {
  const context = useContext(ChatContext)
  if (context === undefined) {
    throw new Error('useChatContext must be used within a ChatProvider')
  }
  return context
} 