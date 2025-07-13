import React, { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useTheme } from '../../context/ThemeContext'
import { cn } from '../../utils/helpers'
import {
  BarChart3, Building2, Users, Car, Calculator, Home,
  ChevronLeft, ChevronRight, Settings, LogOut, User,
  FolderOpen, Briefcase, Building, Wrench, Wallet,
  Menu, X, ChevronDown, ChevronUp
} from 'lucide-react'

const Sidebar = ({ collapsed, mobileOpen, onMobileClose }) => {
  const { user, profile, signOut, hasPermission } = useAuth()
  const { toggleSidebar } = useTheme()
  const location = useLocation()
  const [expandedItems, setExpandedItems] = useState({})

  // Navigation items with permissions
  const navigationItems = [
    {
      id: 'dashboard',
      label: 'Přehled',
      icon: BarChart3,
      path: '/dashboard',
      permission: null // Available to all
    },
    {
      id: 'projects',
      label: 'Projekty',
      icon: FolderOpen,
      permission: 'VIEW_ALL_PROJECTS',
      children: [
        {
          id: 'zakazky',
          label: 'Zakázky',
          path: '/zakazky',
          permission: null
        },
        {
          id: 'vlastni-projekty',
          label: 'Vlastní projekty',
          path: '/projekty',
          permission: 'VIEW_ALL_PROJECTS'
        }
      ]
    },
    {
      id: 'nemovitosti',
      label: 'Nemovitosti',
      icon: Building,
      path: '/nemovitosti',
      permission: 'VIEW_PROPERTIES'
    },
    {
      id: 'finance',
      label: 'Finance',
      icon: Calculator,
      path: '/finance',
      permission: 'VIEW_FINANCES'
    },
    {
      id: 'zamestnanci',
      label: 'Zaměstnanci',
      icon: Users,
      path: '/zamestnanci',
      permission: 'VIEW_EMPLOYEES'
    },
    {
      id: 'flotila',
      label: 'Flotila & Inventář',
      icon: Car,
      permission: 'VIEW_FLEET',
      children: [
        {
          id: 'vozidla',
          label: 'Vozidla',
          path: '/flotila/vozidla',
          permission: 'VIEW_FLEET'
        },
        {
          id: 'naradli',
          label: 'Nářadí',
          path: '/flotila/naradli',
          permission: 'VIEW_FLEET'
        }
      ]
    }
  ]

  // Bottom navigation items
  const bottomNavigationItems = [
    {
      id: 'nastaveni',
      label: 'Nastavení',
      icon: Settings,
      path: '/nastaveni',
      permission: null
    }
  ]

  // Filter items based on permissions
  const filterByPermission = (items) => {
    return items.filter(item => {
      if (!item.permission) return true
      return hasPermission(item.permission)
    }).map(item => ({
      ...item,
      children: item.children ? filterByPermission(item.children) : undefined
    }))
  }

  const visibleNavItems = filterByPermission(navigationItems)
  const visibleBottomItems = filterByPermission(bottomNavigationItems)

  // Toggle expanded state for items with children
  const toggleExpanded = (itemId) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }))
  }

  // Check if item is active
  const isItemActive = (item) => {
    if (item.path) {
      return location.pathname === item.path || location.pathname.startsWith(item.path + '/')
    }
    if (item.children) {
      return item.children.some(child => 
        location.pathname === child.path || location.pathname.startsWith(child.path + '/')
      )
    }
    return false
  }

  // Auto-expand active items
  useEffect(() => {
    visibleNavItems.forEach(item => {
      if (item.children && isItemActive(item)) {
        setExpandedItems(prev => ({ ...prev, [item.id]: true }))
      }
    })
  }, [location.pathname])

  // Handle sign out
  const handleSignOut = async () => {
    await signOut()
  }

  // Render navigation item
  const renderNavItem = (item, level = 0) => {
    const hasChildren = item.children && item.children.length > 0
    const isActive = isItemActive(item)
    const isExpanded = expandedItems[item.id]

    if (hasChildren) {
      return (
        <div key={item.id} className="space-y-1">
          <button
            onClick={() => toggleExpanded(item.id)}
            className={cn(
              'w-full flex items-center justify-between px-3 py-2 text-left rounded-lg transition-colors',
              'hover:bg-gray-100 hover:text-astra-600',
              isActive ? 'bg-astra-50 text-astra-600 font-medium' : 'text-gray-700',
              collapsed && 'justify-center'
            )}
          >
            <div className="flex items-center space-x-3">
              <item.icon className={cn(
                'h-5 w-5 flex-shrink-0',
                isActive ? 'text-astra-600' : 'text-gray-500'
              )} />
              {!collapsed && (
                <span className="font-medium">{item.label}</span>
              )}
            </div>
            {!collapsed && (
              <div className="flex-shrink-0">
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </div>
            )}
          </button>
          
          {!collapsed && isExpanded && (
            <div className="ml-6 space-y-1">
              {item.children.map(child => renderNavItem(child, level + 1))}
            </div>
          )}
        </div>
      )
    }

    return (
      <NavLink
        key={item.id}
        to={item.path}
        onClick={onMobileClose}
        className={({ isActive }) => cn(
          'flex items-center px-3 py-2 rounded-lg transition-colors group',
          'hover:bg-gray-100 hover:text-astra-600',
          isActive 
            ? 'bg-astra-50 text-astra-600 font-medium' 
            : 'text-gray-700',
          level > 0 && 'text-sm',
          collapsed && 'justify-center'
        )}
      >
        <item.icon className={cn(
          'h-5 w-5 flex-shrink-0',
          'group-hover:text-astra-600',
          level > 0 ? 'h-4 w-4' : 'h-5 w-5'
        )} />
        {!collapsed && (
          <span className="ml-3 font-medium">{item.label}</span>
        )}
      </NavLink>
    )
  }

  // Sidebar content
  const sidebarContent = (
    <div className="h-full flex flex-col bg-white border-r border-gray-200">
      {/* Logo and header */}
      <div className={cn(
        'flex items-center p-4 border-b border-gray-200',
        collapsed ? 'justify-center' : 'justify-between'
      )}>
        {!collapsed && (
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-astra rounded-full flex items-center justify-center">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">AstraCore</h1>
              <p className="text-xs text-gray-500">Solutions</p>
            </div>
          </div>
        )}
        
        {/* Collapse toggle - desktop only */}
        <button
          onClick={toggleSidebar}
          className="hidden lg:flex p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronLeft className="h-4 w-4 text-gray-500" />
          )}
        </button>

        {/* Mobile close button */}
        <button
          onClick={onMobileClose}
          className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <X className="h-5 w-5 text-gray-500" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 overflow-y-auto">
        <div className="space-y-2">
          {visibleNavItems.map(item => renderNavItem(item))}
        </div>
      </nav>

      {/* Bottom section */}
      <div className="p-4 border-t border-gray-200 space-y-2">
        {/* Bottom navigation items */}
        {visibleBottomItems.map(item => renderNavItem(item))}

        {/* User profile section */}
        <div className={cn(
          'flex items-center space-x-3 p-3 rounded-lg bg-gray-50',
          collapsed && 'justify-center'
        )}>
          <div className="w-8 h-8 bg-astra-500 rounded-full flex items-center justify-center">
            <User className="h-4 w-4 text-white" />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {profile?.first_name} {profile?.last_name}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {profile?.role === 'owner' && 'Majitel'}
                {profile?.role === 'manager' && 'Manažer'}
                {profile?.role === 'site_manager' && 'Stavbyvedoucí'}
                {profile?.role === 'assistant' && 'Asistentka'}
                {profile?.role === 'employee' && 'Zaměstnanec'}
              </p>
            </div>
          )}
        </div>

        {/* Sign out button */}
        <button
          onClick={handleSignOut}
          className={cn(
            'w-full flex items-center px-3 py-2 text-red-600 rounded-lg',
            'hover:bg-red-50 transition-colors',
            collapsed ? 'justify-center' : 'justify-start'
          )}
        >
          <LogOut className="h-5 w-5" />
          {!collapsed && <span className="ml-3 font-medium">Odhlásit se</span>}
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className={cn(
        'hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:block',
        'transition-all duration-300 ease-in-out',
        collapsed ? 'lg:w-16' : 'lg:w-64'
      )}>
        {sidebarContent}
      </aside>

      {/* Mobile sidebar */}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:hidden',
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        {sidebarContent}
      </aside>
    </>
  )
}

export default Sidebar
