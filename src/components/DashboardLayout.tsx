'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Bars3Icon, MoonIcon, SunIcon } from '@heroicons/react/24/outline'
import Sidebar from './Sidebar'
import MobileSidebar from './MobileSidebar'
import { useTheme } from '@/contexts/ThemeContext'

interface DashboardLayoutProps {
  children: React.ReactNode
}

const getPageInfo = (pathname: string) => {
  switch (pathname) {
    case '/':
      return {
        title: 'Dashboard',
        description: 'Manage and analyze your orders data'
      }
    case '/chat':
      return {
        title: 'Chat Tool',
        description: 'Ask questions about your orders data - powered by AI'
      }
    default:
      return {
        title: 'Admin Tools',
        description: 'Manage your application'
      }
  }
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isManualToggle, setIsManualToggle] = useState(false)
  const { theme, toggleTheme } = useTheme()
  
  // Initialize sidebar state from localStorage immediately
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedCollapsedState = localStorage.getItem('sidebarCollapsed')
      return savedCollapsedState ? JSON.parse(savedCollapsedState) : false
    }
    return false
  })
  
  const pathname = usePathname()
  const pageInfo = getPageInfo(pathname)

  // Save sidebar state to localStorage when it changes
  const toggleSidebar = () => {
    setIsManualToggle(true)
    const newCollapsedState = !sidebarCollapsed
    setSidebarCollapsed(newCollapsedState)
    localStorage.setItem('sidebarCollapsed', JSON.stringify(newCollapsedState))
    
    // Reset manual toggle flag after animation
    setTimeout(() => setIsManualToggle(false), 300)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <MobileSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <Sidebar collapsed={sidebarCollapsed} onToggleCollapse={toggleSidebar} />

      <div className={`${sidebarCollapsed ? 'md:pl-16' : 'md:pl-64'} flex flex-col flex-1 ${isManualToggle ? 'transition-all duration-300' : ''}`}>
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 md:hidden hover:text-gray-900"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Bars3Icon className="h-5 w-5" aria-hidden="true" />
          </button>



          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <div>
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white">{pageInfo.title}</h1>
                <p className="text-sm text-gray-600 dark:text-gray-300">{pageInfo.description}</p>
              </div>
            </div>
            
            {/* Theme Toggle */}
            <div className="flex items-center">
              <button
                onClick={toggleTheme}
                className="p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label="Toggle theme"
              >
                {theme === 'light' ? (
                  <MoonIcon className="h-5 w-5" />
                ) : (
                  <SunIcon className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        <main className="flex-1">
          <div className="py-4 pl-4 sm:py-6 sm:pl-6 lg:pl-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
} 