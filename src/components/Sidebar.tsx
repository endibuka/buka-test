'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  HomeIcon, 
  ChatBubbleLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MoonIcon,
  SunIcon
} from '@heroicons/react/24/outline'
import { useTheme } from '@/contexts/ThemeContext'

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Chat Tool', href: '/chat', icon: ChatBubbleLeftIcon }
]

interface SidebarProps {
  collapsed?: boolean
  onToggleCollapse?: () => void
}

export default function Sidebar({ collapsed = false, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname()
  const { theme, toggleTheme } = useTheme()

  return (
    <div className={`hidden md:fixed md:inset-y-0 md:flex md:flex-col transition-all duration-300 ${collapsed ? 'md:w-16' : 'md:w-64'}`}>
      <div className="flex min-h-0 flex-1 flex-col bg-white border-r border-gray-200 dark:border-gray-700 relative" style={{ backgroundColor: 'var(--sidebar-bg)' }}>
        <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
          <div className={`flex flex-shrink-0 items-center px-4 ${collapsed ? 'justify-center' : ''}`}>
            {collapsed ? (
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">AT</span>
              </div>
            ) : (
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Admin Tools</h1>
            )}
          </div>
          <nav className="mt-8 flex-1 space-y-1 pl-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-r-2 border-blue-700 dark:border-blue-400'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                  } group flex items-center px-2 py-2 text-sm font-medium rounded-l-md ${collapsed ? 'justify-center' : ''}`}
                  title={collapsed ? item.name : undefined}
                >
                  <item.icon
                    className={`${
                      isActive ? 'text-blue-500 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400'
                    } h-5 w-5 flex-shrink-0 ${collapsed ? '' : 'mr-3'}`}
                    aria-hidden="true"
                  />
                  {!collapsed && item.name}
                </Link>
              )
            })}
          </nav>
        </div>
        {!collapsed && (
          <div className="flex flex-shrink-0 border-t border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center">
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Admin User</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">admin@example.com</p>
                </div>
              </div>
              
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label="Toggle theme"
              >
                {theme === 'light' ? (
                  <MoonIcon className="h-4 w-4" />
                ) : (
                  <SunIcon className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        )}
        
        {/* Collapse Toggle Button */}
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="absolute top-1/2 -right-3 transform -translate-y-1/2 w-6 h-6 bg-white border border-gray-200 dark:border-gray-600 rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-shadow duration-200 z-10"
            style={{ backgroundColor: 'var(--sidebar-bg)' }}
          >
            {collapsed ? (
              <ChevronRightIcon className="h-3 w-3 text-gray-600 dark:text-gray-400" />
            ) : (
              <ChevronLeftIcon className="h-3 w-3 text-gray-600 dark:text-gray-400" />
            )}
          </button>
        )}
      </div>
    </div>
  )
} 