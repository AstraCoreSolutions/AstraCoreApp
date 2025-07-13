import React, { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useTheme } from '../../context/ThemeContext'
import Sidebar from './Sidebar'
import Header from './Header'
import MobileMenu from './MobileMenu'
import { cn } from '../../utils/helpers'

const Layout = () => {
  const { user, profile } = useAuth()
  const { sidebarCollapsed } = useTheme()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const location = useLocation()

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location])

  // Handle loading states for navigation
  useEffect(() => {
    setIsLoading(true)
    const timer = setTimeout(() => setIsLoading(false), 300)
    return () => clearTimeout(timer)
  }, [location.pathname])

  // Get current page title
  const getPageTitle = () => {
    const path = location.pathname
    const titles = {
      '/dashboard': 'Přehled',
      '/zakazky': 'Zakázky',
      '/projekty': 'Vlastní projekty',
      '/nemovitosti': 'Nemovitosti',
      '/finance': 'Finance',
      '/zamestnanci': 'Zaměstnanci',
      '/flotila': 'Flotila & Inventář',
      '/nastaveni': 'Nastavení'
    }
    
    // Handle dynamic routes
    if (path.startsWith('/zakazky/')) return 'Detail zakázky'
    if (path.startsWith('/projekty/')) return 'Detail projektu'
    if (path.startsWith('/nemovitosti/')) return 'Detail nemovitosti'
    if (path.startsWith('/finance/')) return 'Finance'
    if (path.startsWith('/zamestnanci/')) return 'Zaměstnanci'
    if (path.startsWith('/flotila/')) return 'Flotila & Inventář'
    if (path.startsWith('/nastaveni/')) return 'Nastavení'
    
    return titles[path] || 'AstraCore Solutions'
  }

  // Get breadcrumbs
  const getBreadcrumbs = () => {
    const path = location.pathname
    const segments = path.split('/').filter(Boolean)
    
    const breadcrumbs = [
      { label: 'Domů', path: '/dashboard' }
    ]
    
    let currentPath = ''
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`
      
      const labels = {
        'dashboard': 'Přehled',
        'zakazky': 'Zakázky',
        'projekty': 'Vlastní projekty', 
        'nemovitosti': 'Nemovitosti',
        'finance': 'Finance',
        'zamestnanci': 'Zaměstnanci',
        'flotila': 'Flotila & Inventář',
        'nastaveni': 'Nastavení'
      }
      
      // Skip dashboard as it's already home
      if (segment !== 'dashboard') {
        breadcrumbs.push({
          label: labels[segment] || segment,
          path: currentPath,
          isLast: index === segments.length - 1
        })
      }
    })
    
    return breadcrumbs
  }

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Alt + M for mobile menu toggle
      if (e.altKey && e.key === 'm') {
        e.preventDefault()
        setMobileMenuOpen(!mobileMenuOpen)
      }
      
      // Escape to close mobile menu
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [mobileMenuOpen])

  // Prevent scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [mobileMenuOpen])

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-astra-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Načítání profilu...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar 
        collapsed={sidebarCollapsed} 
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      {/* Mobile menu */}
      <MobileMenu 
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* Main content area */}
      <div className={cn(
        'transition-all duration-300 ease-in-out',
        sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'
      )}>
        {/* Header */}
        <Header 
          title={getPageTitle()}
          breadcrumbs={getBreadcrumbs()}
          onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
        />

        {/* Page content */}
        <main className="p-4 lg:p-6">
          {/* Loading overlay */}
          {isLoading && (
            <div className="fixed inset-0 bg-white bg-opacity-75 backdrop-blur-sm z-30 flex items-center justify-center lg:ml-64">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-astra-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">Načítání...</p>
              </div>
            </div>
          )}

          {/* Page content container */}
          <div className={cn(
            'transition-opacity duration-300',
            isLoading ? 'opacity-50' : 'opacity-100'
          )}>
            <Outlet />
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 py-4 px-4 lg:px-6">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
            <div className="text-sm text-gray-600">
              © 2025 AstraCore Solutions. Všechna práva vyhrazena.
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>Verze 1.0.0</span>
              <span>•</span>
              <span>Uživatel: {profile?.first_name} {profile?.last_name}</span>
              <span>•</span>
              <span>Role: {profile?.role}</span>
            </div>
          </div>
        </footer>
      </div>

      {/* Global notifications area */}
      <div id="notifications-portal" className="fixed bottom-4 right-4 z-50 space-y-2">
        {/* Toast notifications will be rendered here */}
      </div>

      {/* Development helpers */}
      {import.meta.env.DEV && (
        <div className="fixed bottom-4 left-4 z-50">
          <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-2 text-xs">
            <div>Route: {location.pathname}</div>
            <div>User: {user?.email}</div>
            <div>Role: {profile?.role}</div>
            <div>Sidebar: {sidebarCollapsed ? 'Collapsed' : 'Expanded'}</div>
          </div>
        </div>
      )}

      {/* Accessibility improvements */}
      <div className="sr-only">
        <h1>{getPageTitle()}</h1>
        <nav aria-label="Breadcrumb">
          <ol>
            {getBreadcrumbs().map((crumb, index) => (
              <li key={index}>
                {crumb.isLast ? crumb.label : `${crumb.label} > `}
              </li>
            ))}
          </ol>
        </nav>
      </div>

      {/* Skip to main content link */}
      <a 
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-astra-600 text-white px-4 py-2 rounded-lg z-50"
      >
        Přejít na hlavní obsah
      </a>
    </div>
  )
}

export default Layout
