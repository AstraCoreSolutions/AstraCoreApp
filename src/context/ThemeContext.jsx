import React, { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext({
  theme: 'light',
  setTheme: () => {},
  toggleTheme: () => {},
  sidebarCollapsed: false,
  setSidebarCollapsed: () => {},
  toggleSidebar: () => {},
  preferences: {},
  updatePreferences: () => {},
})

// Default user preferences
const DEFAULT_PREFERENCES = {
  language: 'cs',
  dateFormat: 'dd.MM.yyyy',
  timeFormat: '24h',
  currency: 'CZK',
  notifications: {
    email: true,
    push: true,
    desktop: true,
    deadlines: true,
    expenses: true,
    team: true
  },
  dashboard: {
    defaultView: 'overview',
    cardsPerRow: 4,
    showWelcome: true,
    autoRefresh: true,
    refreshInterval: 300000 // 5 minutes
  },
  table: {
    rowsPerPage: 25,
    showFilters: true,
    compactMode: false
  },
  finance: {
    defaultCurrency: 'CZK',
    showVAT: true,
    vatRate: 21,
    fiscalYearStart: 'january',
    budgetAlerts: true
  }
}

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('light')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES)

  // Initialize theme and preferences from localStorage
  useEffect(() => {
    try {
      // Load theme
      const savedTheme = localStorage.getItem('astracore-theme')
      if (savedTheme && ['light', 'dark'].includes(savedTheme)) {
        setTheme(savedTheme)
      } else {
        // Detect system preference
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
        setTheme(systemTheme)
      }

      // Load sidebar state
      const savedSidebar = localStorage.getItem('astracore-sidebar-collapsed')
      if (savedSidebar !== null) {
        setSidebarCollapsed(savedSidebar === 'true')
      }

      // Load user preferences
      const savedPreferences = localStorage.getItem('astracore-preferences')
      if (savedPreferences) {
        const parsed = JSON.parse(savedPreferences)
        setPreferences({ ...DEFAULT_PREFERENCES, ...parsed })
      }
    } catch (error) {
      console.error('Error loading theme preferences:', error)
    }
  }, [])

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement
    
    if (theme === 'dark') {
      root.classList.add('dark')
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#243b53')
    } else {
      root.classList.remove('dark')
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#627d98')
    }

    // Save to localStorage
    localStorage.setItem('astracore-theme', theme)
  }, [theme])

  // Save sidebar state
  useEffect(() => {
    localStorage.setItem('astracore-sidebar-collapsed', sidebarCollapsed.toString())
  }, [sidebarCollapsed])

  // Save preferences
  useEffect(() => {
    try {
      localStorage.setItem('astracore-preferences', JSON.stringify(preferences))
    } catch (error) {
      console.error('Error saving preferences:', error)
    }
  }, [preferences])

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const handleChange = (e) => {
      // Only auto-switch if user hasn't manually set a theme
      const savedTheme = localStorage.getItem('astracore-theme')
      if (!savedTheme) {
        setTheme(e.matches ? 'dark' : 'light')
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  // Toggle theme
  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }

  // Toggle sidebar
  const toggleSidebar = () => {
    setSidebarCollapsed(prev => !prev)
  }

  // Update specific preference
  const updatePreferences = (path, value) => {
    setPreferences(prev => {
      const newPrefs = { ...prev }
      
      // Handle nested paths like 'dashboard.cardsPerRow'
      const keys = path.split('.')
      let current = newPrefs
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {}
        }
        current = current[keys[i]]
      }
      
      current[keys[keys.length - 1]] = value
      return newPrefs
    })
  }

  // Reset preferences to default
  const resetPreferences = () => {
    setPreferences(DEFAULT_PREFERENCES)
    localStorage.removeItem('astracore-preferences')
  }

  // Get formatted date string based on preferences
  const formatDate = (date, options = {}) => {
    if (!date) return ''
    
    const dateObj = date instanceof Date ? date : new Date(date)
    if (isNaN(dateObj.getTime())) return ''

    const format = options.format || preferences.dateFormat || 'dd.MM.yyyy'
    const locale = preferences.language === 'cs' ? 'cs-CZ' : 'en-US'

    try {
      if (format === 'dd.MM.yyyy') {
        return dateObj.toLocaleDateString(locale, {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        })
      } else if (format === 'MM/dd/yyyy') {
        return dateObj.toLocaleDateString('en-US', {
          month: '2-digit',
          day: '2-digit',
          year: 'numeric'
        })
      } else if (format === 'yyyy-MM-dd') {
        return dateObj.toISOString().split('T')[0]
      } else {
        return dateObj.toLocaleDateString(locale)
      }
    } catch (error) {
      console.error('Date formatting error:', error)
      return dateObj.toLocaleDateString()
    }
  }

  // Get formatted time string based on preferences
  const formatTime = (date, options = {}) => {
    if (!date) return ''
    
    const dateObj = date instanceof Date ? date : new Date(date)
    if (isNaN(dateObj.getTime())) return ''

    const format = options.format || preferences.timeFormat || '24h'
    const locale = preferences.language === 'cs' ? 'cs-CZ' : 'en-US'

    try {
      if (format === '24h') {
        return dateObj.toLocaleTimeString(locale, {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        })
      } else {
        return dateObj.toLocaleTimeString(locale, {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        })
      }
    } catch (error) {
      console.error('Time formatting error:', error)
      return dateObj.toLocaleTimeString()
    }
  }

  // Format currency based on preferences
  const formatCurrency = (amount, options = {}) => {
    if (amount === null || amount === undefined || isNaN(amount)) return ''
    
    const currency = options.currency || preferences.currency || 'CZK'
    const locale = preferences.language === 'cs' ? 'cs-CZ' : 'en-US'

    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: options.decimals !== undefined ? options.decimals : 2,
        maximumFractionDigits: options.decimals !== undefined ? options.decimals : 2
      }).format(amount)
    } catch (error) {
      console.error('Currency formatting error:', error)
      return `${amount} ${currency}`
    }
  }

  // Format number based on locale
  const formatNumber = (number, options = {}) => {
    if (number === null || number === undefined || isNaN(number)) return ''
    
    const locale = preferences.language === 'cs' ? 'cs-CZ' : 'en-US'

    try {
      return new Intl.NumberFormat(locale, {
        minimumFractionDigits: options.decimals || 0,
        maximumFractionDigits: options.decimals || 0
      }).format(number)
    } catch (error) {
      console.error('Number formatting error:', error)
      return number.toString()
    }
  }

  // Get responsive breakpoint helpers
  const getBreakpoint = () => {
    if (typeof window === 'undefined') return 'lg'
    
    const width = window.innerWidth
    if (width < 640) return 'sm'
    if (width < 768) return 'md'
    if (width < 1024) return 'lg'
    if (width < 1280) return 'xl'
    return '2xl'
  }

  const value = {
    theme,
    setTheme,
    toggleTheme,
    sidebarCollapsed,
    setSidebarCollapsed,
    toggleSidebar,
    preferences,
    updatePreferences,
    resetPreferences,
    formatDate,
    formatTime,
    formatCurrency,
    formatNumber,
    getBreakpoint,
    DEFAULT_PREFERENCES
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

export default ThemeContext
