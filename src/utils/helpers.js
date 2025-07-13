import { clsx } from 'clsx'

/**
 * Combines class names using clsx
 * @param {...any} classes - Class names to combine
 * @returns {string} Combined class names
 */
export const cn = (...classes) => {
  return clsx(classes)
}

/**
 * Format currency with Czech locale
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code (default: CZK)
 * @param {object} options - Formatting options
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, currency = 'CZK', options = {}) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '0 Kč'
  }

  const defaultOptions = {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }

  try {
    return new Intl.NumberFormat('cs-CZ', { 
      ...defaultOptions, 
      ...options 
    }).format(amount)
  } catch (error) {
    console.error('Currency formatting error:', error)
    return `${amount} ${currency}`
  }
}

/**
 * Format number with Czech locale
 * @param {number} number - Number to format
 * @param {object} options - Formatting options
 * @returns {string} Formatted number string
 */
export const formatNumber = (number, options = {}) => {
  if (number === null || number === undefined || isNaN(number)) {
    return '0'
  }

  try {
    return new Intl.NumberFormat('cs-CZ', options).format(number)
  } catch (error) {
    console.error('Number formatting error:', error)
    return number.toString()
  }
}

/**
 * Format date with Czech locale
 * @param {Date|string} date - Date to format
 * @param {object} options - Formatting options
 * @returns {string} Formatted date string
 */
export const formatDate = (date, options = {}) => {
  if (!date) return ''
  
  const dateObj = date instanceof Date ? date : new Date(date)
  if (isNaN(dateObj.getTime())) return ''

  const defaultOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }

  try {
    return dateObj.toLocaleDateString('cs-CZ', { ...defaultOptions, ...options })
  } catch (error) {
    console.error('Date formatting error:', error)
    return dateObj.toLocaleDateString()
  }
}

/**
 * Format time with Czech locale
 * @param {Date|string} date - Date to format
 * @param {object} options - Formatting options
 * @returns {string} Formatted time string
 */
export const formatTime = (date, options = {}) => {
  if (!date) return ''
  
  const dateObj = date instanceof Date ? date : new Date(date)
  if (isNaN(dateObj.getTime())) return ''

  const defaultOptions = {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }

  try {
    return dateObj.toLocaleTimeString('cs-CZ', { ...defaultOptions, ...options })
  } catch (error) {
    console.error('Time formatting error:', error)
    return dateObj.toLocaleTimeString()
  }
}

/**
 * Format datetime with Czech locale
 * @param {Date|string} date - Date to format
 * @param {object} options - Formatting options
 * @returns {string} Formatted datetime string
 */
export const formatDateTime = (date, options = {}) => {
  if (!date) return ''
  
  const dateObj = date instanceof Date ? date : new Date(date)
  if (isNaN(dateObj.getTime())) return ''

  const defaultOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }

  try {
    return dateObj.toLocaleString('cs-CZ', { ...defaultOptions, ...options })
  } catch (error) {
    console.error('DateTime formatting error:', error)
    return dateObj.toLocaleString()
  }
}

/**
 * Get relative time (e.g., "před 2 hodinami")
 * @param {Date|string} date - Date to compare
 * @param {Date} baseDate - Base date for comparison (default: now)
 * @returns {string} Relative time string
 */
export const formatRelativeTime = (date, baseDate = new Date()) => {
  if (!date) return ''
  
  const dateObj = date instanceof Date ? date : new Date(date)
  if (isNaN(dateObj.getTime())) return ''

  const diffInSeconds = Math.floor((baseDate - dateObj) / 1000)
  const diffInMinutes = Math.floor(diffInSeconds / 60)
  const diffInHours = Math.floor(diffInMinutes / 60)
  const diffInDays = Math.floor(diffInHours / 24)

  if (diffInSeconds < 60) return 'právě teď'
  if (diffInMinutes < 60) return `před ${diffInMinutes} min`
  if (diffInHours < 24) return `před ${diffInHours} h`
  if (diffInDays < 7) return `před ${diffInDays} dny`
  if (diffInDays < 30) return `před ${Math.floor(diffInDays / 7)} týdny`
  if (diffInDays < 365) return `před ${Math.floor(diffInDays / 30)} měsíci`
  
  return `před ${Math.floor(diffInDays / 365)} lety`
}

/**
 * Calculate percentage
 * @param {number} value - Current value
 * @param {number} total - Total value
 * @param {number} decimals - Number of decimal places (default: 1)
 * @returns {number} Percentage
 */
export const calculatePercentage = (value, total, decimals = 1) => {
  if (!total || total === 0) return 0
  return Math.round((value / total) * 100 * Math.pow(10, decimals)) / Math.pow(10, decimals)
}

/**
 * Truncate text to specified length
 * @param {string} text - Text to truncate
 * @param {number} length - Maximum length
 * @param {string} suffix - Suffix to add when truncated (default: '...')
 * @returns {string} Truncated text
 */
export const truncateText = (text, length, suffix = '...') => {
  if (!text || text.length <= length) return text || ''
  return text.substring(0, length) + suffix
}

/**
 * Debounce function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @param {boolean} immediate - Execute immediately
 * @returns {Function} Debounced function
 */
export const debounce = (func, wait, immediate = false) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      timeout = null
      if (!immediate) func.apply(this, args)
    }
    const callNow = immediate && !timeout
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
    if (callNow) func.apply(this, args)
  }
}

/**
 * Throttle function
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
export const throttle = (func, limit) => {
  let inThrottle
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

/**
 * Generate unique ID
 * @param {string} prefix - Prefix for the ID
 * @returns {string} Unique ID
 */
export const generateId = (prefix = 'id') => {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Deep clone object
 * @param {any} obj - Object to clone
 * @returns {any} Cloned object
 */
export const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj
  if (obj instanceof Date) return new Date(obj.getTime())
  if (obj instanceof Array) return obj.map(item => deepClone(item))
  if (typeof obj === 'object') {
    const clonedObj = {}
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key])
      }
    }
    return clonedObj
  }
}

/**
 * Check if value is empty
 * @param {any} value - Value to check
 * @returns {boolean} True if empty
 */
export const isEmpty = (value) => {
  if (value === null || value === undefined) return true
  if (typeof value === 'string') return value.trim() === ''
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'object') return Object.keys(value).length === 0
  return false
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate Czech phone number
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if valid phone
 */
export const isValidPhone = (phone) => {
  const phoneRegex = /^(\+420\s?)?[1-9][0-9]{8}$/
  return phoneRegex.test(phone.replace(/\s/g, ''))
}

/**
 * Format Czech phone number
 * @param {string} phone - Phone number to format
 * @returns {string} Formatted phone number
 */
export const formatPhone = (phone) => {
  if (!phone) return ''
  const cleaned = phone.replace(/\D/g, '')
  
  if (cleaned.startsWith('420')) {
    const number = cleaned.substring(3)
    return `+420 ${number.substring(0, 3)} ${number.substring(3, 6)} ${number.substring(6)}`
  }
  
  if (cleaned.length === 9) {
    return `${cleaned.substring(0, 3)} ${cleaned.substring(3, 6)} ${cleaned.substring(6)}`
  }
  
  return phone
}

/**
 * Calculate VAT amount
 * @param {number} amount - Amount without VAT
 * @param {number} vatRate - VAT rate in percentage (default: 21)
 * @returns {object} Object with net, vat, and gross amounts
 */
export const calculateVAT = (amount, vatRate = 21) => {
  if (!amount || isNaN(amount)) {
    return { net: 0, vat: 0, gross: 0 }
  }
  
  const net = parseFloat(amount)
  const vat = net * (vatRate / 100)
  const gross = net + vat
  
  return {
    net: Math.round(net * 100) / 100,
    vat: Math.round(vat * 100) / 100,
    gross: Math.round(gross * 100) / 100
  }
}

/**
 * Calculate amount from gross (with VAT)
 * @param {number} grossAmount - Amount with VAT
 * @param {number} vatRate - VAT rate in percentage (default: 21)
 * @returns {object} Object with net, vat, and gross amounts
 */
export const calculateFromGross = (grossAmount, vatRate = 21) => {
  if (!grossAmount || isNaN(grossAmount)) {
    return { net: 0, vat: 0, gross: 0 }
  }
  
  const gross = parseFloat(grossAmount)
  const net = gross / (1 + vatRate / 100)
  const vat = gross - net
  
  return {
    net: Math.round(net * 100) / 100,
    vat: Math.round(vat * 100) / 100,
    gross: Math.round(gross * 100) / 100
  }
}

/**
 * Sort array by multiple criteria
 * @param {Array} array - Array to sort
 * @param {Array} criteria - Sort criteria [{key, direction}]
 * @returns {Array} Sorted array
 */
export const multiSort = (array, criteria) => {
  return [...array].sort((a, b) => {
    for (const criterion of criteria) {
      const { key, direction = 'asc' } = criterion
      const aVal = key.split('.').reduce((obj, k) => obj?.[k], a)
      const bVal = key.split('.').reduce((obj, k) => obj?.[k], b)
      
      if (aVal < bVal) return direction === 'asc' ? -1 : 1
      if (aVal > bVal) return direction === 'asc' ? 1 : -1
    }
    return 0
  })
}

/**
 * Download data as file
 * @param {string} data - Data to download
 * @param {string} filename - File name
 * @param {string} type - MIME type
 */
export const downloadFile = (data, filename, type = 'text/plain') => {
  const blob = new Blob([data], { type })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

/**
 * Get file size in human readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Get status color class
 * @param {string} status - Status string
 * @returns {string} CSS class for status color
 */
export const getStatusColor = (status) => {
  const statusColors = {
    active: 'text-success-600 bg-success-50 border-success-200',
    inactive: 'text-gray-600 bg-gray-50 border-gray-200',
    pending: 'text-warning-600 bg-warning-50 border-warning-200',
    error: 'text-error-600 bg-error-50 border-error-200',
    warning: 'text-warning-600 bg-warning-50 border-warning-200',
    success: 'text-success-600 bg-success-50 border-success-200',
    info: 'text-info-600 bg-info-50 border-info-200'
  }
  
  return statusColors[status?.toLowerCase()] || statusColors.inactive
}

/**
 * Convert RGB to HSL
 * @param {number} r - Red (0-255)
 * @param {number} g - Green (0-255)
 * @param {number} b - Blue (0-255)
 * @returns {object} HSL values
 */
export const rgbToHsl = (r, g, b) => {
  r /= 255
  g /= 255
  b /= 255
  
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h, s, l = (max + min) / 2
  
  if (max === min) {
    h = s = 0
  } else {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break
      case g: h = (b - r) / d + 2; break
      case b: h = (r - g) / d + 4; break
    }
    h /= 6
  }
  
  return { h: h * 360, s: s * 100, l: l * 100 }
}
