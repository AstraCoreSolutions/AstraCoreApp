import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useTheme } from '../../context/ThemeContext'
import { cn } from '../../utils/helpers'
import {
  Menu, Bell, Search, Sun, Moon, User, Settings, LogOut,
  ChevronRight, Home, Plus, RefreshCw, Download, Filter,
  MessageSquare, HelpCircle, AlertCircle, CheckCircle
} from 'lucide-react'

const Header = ({ title, breadcrumbs = [], onMobileMenuToggle }) => {
  const { user, profile, signOut, hasPermission } = useAuth()
  const { theme, toggleTheme, formatDateTime } = useTheme()
  const [showNotifications, setShowNotifications] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentTime, setCurrentTime] = useState(new Date())
  
  const notificationRef = useRef(null)
  const userMenuRef = useRef(null)

  // Mock notifications
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'warning',
      title: 'Servis vozidla',
      message: 'Vozidlo ABC-123 potřebuje servis za 3 dny',
      time: new Date(Date.now() - 2 * 60 * 60 * 1000),
      read: false,
      action: '/flotila/vozidla'
    },
    {
      id: 2,
      type: 'info',
      title: 'Nová nabídka',
      message: 'Nabídka "Rekonstrukce kanceláří" čeká na schválení',
      time: new Date(Date.now() - 4 * 60 * 60 * 1000),
      read: false,
      action: '/zakazky'
    },
    {
      id: 3,
      type: 'success',
      title: 'Platba přijata',
      message: 'Faktura č. 2024/156 byla uhrazena',
      time: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      read: true,
      action: '/finance'
    },
    {
      id: 4,
      type: 'error',
      title: 'Překročen rozpočet',
      message: 'Projekt "Kancelářský komplex" překročil rozpočet o 15%',
      time: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      read: true,
      action: '/projekty/1'
    }
  ])

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)
    return () => clearInterval(timer)
  }, [])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false)
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl/Cmd + K for search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        document.getElementById('global-search')?.focus()
      }
      
      // Escape to close dropdowns
      if (e.key === 'Escape') {
        setShowNotifications(false)
        setShowUserMenu(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Mark notification as read
  const markAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, read: true }
          : notif
      )
    )
  }

  // Clear all notifications
  const clearAllNotifications = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })))
  }

  // Get unread count
  const unreadCount = notifications.filter(n => !n.read).length

  // Get notification icon
  const getNotificationIcon = (type) => {
    const icons = {
      success: CheckCircle,
      warning: AlertCircle,
      error: AlertCircle,
      info: Bell
    }
    const Icon = icons[type] || Bell
    return Icon
  }

  // Get notification color
  const getNotificationColor = (type) => {
    const colors = {
      success: 'text-success-500',
      warning: 'text-warning-500',
      error: 'text-error-500',
      info: 'text-info-500'
    }
    return colors[type] || 'text-gray-500'
  }

  // Format relative time
  const formatRelativeTime = (date) => {
    const now = new Date()
    const diffInMinutes = Math.floor((now - date) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'právě teď'
    if (diffInMinutes < 60) return `před ${diffInMinutes} min`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `před ${diffInHours} h`
    
    const diffInDays = Math.floor(diffInHours / 24)
    return `před ${diffInDays} dny`
  }

  return (
    <header className="bg-white border-b border-gray-200 px-4 lg:px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left section */}
        <div className="flex items-center space-x-4">
          {/* Mobile menu button */}
          <button
            onClick={onMobileMenuToggle}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Menu className="h-5 w-5 text-gray-600" />
          </button>

          {/* Breadcrumbs and title */}
          <div>
            {/* Breadcrumbs */}
            {breadcrumbs.length > 0 && (
              <nav className="hidden sm:flex items-center space-x-1 text-sm text-gray-500 mb-1">
                {breadcrumbs.map((crumb, index) => (
                  <div key={index} className="flex items-center">
                    {index === 0 ? (
                      <Home className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4 mx-1" />
                    )}
                    {crumb.isLast ? (
                      <span className="text-gray-900 font-medium">{crumb.label}</span>
                    ) : (
                      <Link
                        to={crumb.path}
                        className="hover:text-astra-600 transition-colors"
                      >
                        {crumb.label}
                      </Link>
                    )}
                  </div>
                ))}
              </nav>
            )}
            
            {/* Page title */}
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900">
              {title}
            </h1>
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center space-x-2 lg:space-x-4">
          {/* Global search */}
          <div className="hidden md:block relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              id="global-search"
              type="text"
              placeholder="Hledat... (Ctrl+K)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-64 pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-astra-500 focus:border-astra-500"
            />
          </div>

          {/* Current time */}
          <div className="hidden lg:block text-sm text-gray-600">
            {formatDateTime(currentTime)}
          </div>

          {/* Quick actions */}
          {hasPermission('EDIT_PROJECTS') && (
            <button className="hidden lg:flex items-center px-3 py-2 bg-astra-500 text-white rounded-lg hover:bg-astra-600 transition-colors">
              <Plus className="h-4 w-4 mr-2" />
              Nový projekt
            </button>
          )}

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            title={theme === 'light' ? 'Přepnout na tmavý režim' : 'Přepnout na světlý režim'}
          >
            {theme === 'light' ? (
              <Moon className="h-5 w-5 text-gray-600" />
            ) : (
              <Sun className="h-5 w-5 text-gray-600" />
            )}
          </button>

          {/* Notifications */}
          <div ref={notificationRef} className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Bell className="h-5 w-5 text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-error-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notifications dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-900">Oznámení</h3>
                    {unreadCount > 0 && (
                      <button
                        onClick={clearAllNotifications}
                        className="text-sm text-astra-600 hover:text-astra-700"
                      >
                        Označit vše jako přečtené
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.map((notification) => {
                      const Icon = getNotificationIcon(notification.type)
                      return (
                        <div
                          key={notification.id}
                          className={cn(
                            'p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer',
                            !notification.read && 'bg-blue-50'
                          )}
                          onClick={() => {
                            markAsRead(notification.id)
                            if (notification.action) {
                              window.location.href = notification.action
                            }
                          }}
                        >
                          <div className="flex space-x-3">
                            <Icon className={cn('h-5 w-5 mt-0.5', getNotificationColor(notification.type))} />
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{notification.title}</p>
                              <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                              <p className="text-xs text-gray-500 mt-2">
                                {formatRelativeTime(notification.time)}
                              </p>
                            </div>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-astra-500 rounded-full mt-2"></div>
                            )}
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div className="p-8 text-center text-gray-500">
                      <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      <p>Žádná nová oznámení</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User menu */}
          <div ref={userMenuRef} className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="w-8 h-8 bg-astra-500 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-sm font-medium text-gray-900">
                  {profile?.first_name} {profile?.last_name}
                </p>
                <p className="text-xs text-gray-500">
                  {profile?.role === 'owner' && 'Majitel'}
                  {profile?.role === 'manager' && 'Manažer'}
                  {profile?.role === 'site_manager' && 'Stavbyvedoucí'}
                  {profile?.role === 'assistant' && 'Asistentka'}
                  {profile?.role === 'employee' && 'Zaměstnanec'}
                </p>
              </div>
            </button>

            {/* User dropdown */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="p-4 border-b border-gray-200">
                  <p className="font-medium text-gray-900">
                    {profile?.first_name} {profile?.last_name}
                  </p>
                  <p className="text-sm text-gray-500">{user?.email}</p>
                </div>
                
                <div className="py-2">
                  <Link
                    to="/profil"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <User className="h-4 w-4 mr-3" />
                    Můj profil
                  </Link>
                  
                  <Link
                    to="/nastaveni"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <Settings className="h-4 w-4 mr-3" />
                    Nastavení
                  </Link>
                  
                  <Link
                    to="/napoveda"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <HelpCircle className="h-4 w-4 mr-3" />
                    Nápověda
                  </Link>
                  
                  <hr className="my-2" />
                  
                  <button
                    onClick={() => {
                      setShowUserMenu(false)
                      signOut()
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4 mr-3" />
                    Odhlásit se
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
