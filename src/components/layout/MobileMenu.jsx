import React, { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { cn } from '../../utils/helpers'
import {
  X, ChevronDown, ChevronUp, BarChart3, Building2, Users, 
  Car, Calculator, Home, FolderOpen, Briefcase, Building, 
  Wrench, Wallet, Settings, LogOut, User, Phone, Mail,
  Clock, MapPin
} from 'lucide-react'

const MobileMenu = ({ isOpen, onClose }) => {
  const { profile, signOut, hasPermission } = useAuth()
  const location = useLocation()
  const [expandedItems, setExpandedItems] = useState({})

  // Navigation items with permissions (same as Sidebar)
  const navigationItems = [
    {
      id: 'dashboard',
      label: 'Přehled',
      icon: BarChart3,
      path: '/dashboard',
      permission: null
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
    },
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

  // Close menu when route changes
  useEffect(() => {
    onClose()
  }, [location.pathname, onClose])

  // Prevent scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

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
    onClose()
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
              'w-full flex items-center justify-between p-3 text-left rounded-lg transition-colors',
              'hover:bg-gray-100 active:bg-gray-200',
              isActive ? 'bg-astra-50 text-astra-600 font-medium' : 'text-gray-700'
            )}
          >
            <div className="flex items-center space-x-3">
              <item.icon className={cn(
                'h-6 w-6 flex-shrink-0',
                isActive ? 'text-astra-600' : 'text-gray-500'
              )} />
              <span className="font-medium text-base">{item.label}</span>
            </div>
            <div className="flex-shrink-0">
              {isExpanded ? (
                <ChevronUp className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-400" />
              )}
            </div>
          </button>
          
          {isExpanded && (
            <div className="ml-9 space-y-1">
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
        onClick={onClose}
        className={({ isActive }) => cn(
          'flex items-center p-3 rounded-lg transition-colors active:bg-gray-200',
          'hover:bg-gray-100',
          isActive 
            ? 'bg-astra-50 text-astra-600 font-medium' 
            : 'text-gray-700',
          level > 0 && 'text-sm py-2'
        )}
      >
        <item.icon className={cn(
          'flex-shrink-0',
          level > 0 ? 'h-5 w-5' : 'h-6 w-6'
        )} />
        <span className={cn(
          'ml-3 font-medium',
          level > 0 ? 'text-sm' : 'text-base'
        )}>
          {item.label}
        </span>
      </NavLink>
    )
  }

  // Get role display name
  const getRoleDisplayName = (role) => {
    const roleNames = {
      'owner': 'Majitel',
      'manager': 'Manažer',
      'site_manager': 'Stavbyvedoucí',
      'assistant': 'Asistentka',
      'employee': 'Zaměstnanec'
    }
    return roleNames[role] || 'Uživatel'
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Menu panel */}
      <div className="fixed inset-y-0 left-0 w-full max-w-sm bg-white shadow-xl transform transition-transform">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-astra-50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-astra rounded-full flex items-center justify-center">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">AstraCore</h1>
              <p className="text-sm text-gray-600">Solutions</p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="h-6 w-6 text-gray-500" />
          </button>
        </div>

        {/* User info */}
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-astra-500 rounded-full flex items-center justify-center">
              <User className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base font-medium text-gray-900 truncate">
                {profile?.first_name} {profile?.last_name}
              </p>
              <p className="text-sm text-gray-600 truncate">
                {getRoleDisplayName(profile?.role)}
              </p>
            </div>
          </div>
          
          {/* Quick info */}
          <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-gray-600">
            <div className="flex items-center space-x-1">
              <Clock className="h-3 w-3" />
              <span>{new Date().toLocaleTimeString('cs-CZ', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}</span>
            </div>
            <div className="flex items-center space-x-1">
              <MapPin className="h-3 w-3" />
              <span>Praha</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 overflow-y-auto">
          <div className="space-y-2">
            {visibleNavItems.map(item => renderNavItem(item))}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 space-y-3">
          {/* Quick actions */}
          <div className="grid grid-cols-2 gap-3">
            <button className="flex items-center justify-center p-2 bg-astra-50 text-astra-600 rounded-lg hover:bg-astra-100 transition-colors">
              <Phone className="h-4 w-4 mr-2" />
              <span className="text-sm font-medium">Kontakt</span>
            </button>
            <button className="flex items-center justify-center p-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
              <Mail className="h-4 w-4 mr-2" />
              <span className="text-sm font-medium">Email</span>
            </button>
          </div>
          
          {/* Sign out button */}
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center p-3 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
          >
            <LogOut className="h-5 w-5 mr-3" />
            <span className="font-medium">Odhlásit se</span>
          </button>
          
          {/* App info */}
          <div className="text-center text-xs text-gray-500 pt-2">
            <p>AstraCore Solutions v1.0.0</p>
            <p>© 2025 Všechna práva vyhrazena</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MobileMenu
