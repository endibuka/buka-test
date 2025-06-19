interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface ChatSession {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: Date
  updatedAt: Date
}

class ChatStorageService {
  private dbName = 'ChatDatabase'
  private dbVersion = 1
  private storeName = 'chats'
  private db: IDBDatabase | null = null

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion)

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'))
      }

      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' })
          store.createIndex('createdAt', 'createdAt', { unique: false })
          store.createIndex('updatedAt', 'updatedAt', { unique: false })
        }
      }
    })
  }

  async saveChat(chat: ChatSession): Promise<void> {
    if (!this.db) await this.init()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      
      const request = store.put({
        ...chat,
        updatedAt: new Date()
      })

      request.onsuccess = () => resolve()
      request.onerror = () => reject(new Error('Failed to save chat'))
    })
  }

  async getChat(id: string): Promise<ChatSession | null> {
    if (!this.db) await this.init()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      const request = store.get(id)

      request.onsuccess = () => {
        const result = request.result
        if (result) {
          // Convert date strings back to Date objects
          result.createdAt = new Date(result.createdAt)
          result.updatedAt = new Date(result.updatedAt)
          result.messages = result.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        }
        resolve(result || null)
      }
      request.onerror = () => reject(new Error('Failed to get chat'))
    })
  }

  async getAllChats(): Promise<ChatSession[]> {
    if (!this.db) await this.init()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      const index = store.index('updatedAt')
      const request = index.getAll()

      request.onsuccess = () => {
        const results = request.result.map((chat: any) => ({
          ...chat,
          createdAt: new Date(chat.createdAt),
          updatedAt: new Date(chat.updatedAt),
          messages: chat.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        }))
        
        // Sort by most recent first
        results.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
        resolve(results)
      }
      request.onerror = () => reject(new Error('Failed to get all chats'))
    })
  }

  async deleteChat(id: string): Promise<void> {
    if (!this.db) await this.init()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.delete(id)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(new Error('Failed to delete chat'))
    })
  }

  generateChatId(): string {
    return `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  generateChatTitle(messages: ChatMessage[]): string {
    const firstUserMessage = messages.find(msg => msg.role === 'user')
    if (firstUserMessage) {
      // Take first 50 characters of the first user message
      return firstUserMessage.content.length > 50 
        ? firstUserMessage.content.substring(0, 50) + '...'
        : firstUserMessage.content
    }
    return `Chat ${new Date().toLocaleDateString()}`
  }
}

// Create a singleton instance
export const chatStorage = new ChatStorageService()

// Export types
export type { ChatMessage, ChatSession } 