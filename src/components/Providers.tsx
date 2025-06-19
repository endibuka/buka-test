'use client'

import { ThemeProvider } from '@/contexts/ThemeContext'
import { ChatProvider } from '@/contexts/ChatContext'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ChatProvider>
        {children}
      </ChatProvider>
    </ThemeProvider>
  )
} 