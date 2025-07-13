import React, { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { Eye, EyeOff, Lock, Mail, Building2, AlertCircle, CheckCircle } from 'lucide-react'
import LoadingSpinner from '../ui/LoadingSpinner'

const LoginPage = () => {
  const { signIn, resetPassword, loading } = useAuth()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [resetEmailSent, setResetEmailSent] = useState(false)

  // Demo accounts for development
  const demoAccounts = [
    { email: 'majitel@astracore.pro', password: 'demo123', role: 'Majitel' },
    { email: 'manager@astracore.pro', password: 'demo123', role: 'Manažer' },
    { email: 'stavbyvedouci@astracore.pro', password: 'demo123', role: 'Stavbyvedoucí' },
    { email: 'asistentka@astracore.pro', password: 'demo123', role: 'Asistentka' },
    { email: 'zamestnanec@astracore.pro', password: 'demo123', role: 'Zaměstnanec' }
  ]

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  // Validate form
  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.email) {
      newErrors.email = 'Email je povinný'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Neplatný formát emailu'
    }
    
    if (!formData.password) {
      newErrors.password = 'Heslo je povinné'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Heslo musí mít alespoň 6 znaků'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setIsLoading(true)
    setErrors({})
    
    try {
      const result = await signIn(formData.email, formData.password)
      
      if (!result.success) {
        setErrors({ general: result.error })
      }
    } catch (error) {
      setErrors({ general: 'Došlo k neočekávané chybě' })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle forgot password
  const handleForgotPassword = async (e) => {
    e.preventDefault()
    
    if (!formData.email) {
      setErrors({ email: 'Zadejte email pro reset hesla' })
      return
    }
    
    setIsLoading(true)
    setErrors({})
    
    try {
      const result = await resetPassword(formData.email)
      
      if (result.success) {
        setResetEmailSent(true)
        setShowForgotPassword(false)
      } else {
        setErrors({ general: result.error })
      }
    } catch (error) {
      setErrors({ general: 'Chyba při odesílání emailu' })
    } finally {
      setIsLoading(false)
    }
  }

  // Fill demo account
  const fillDemoAccount = (account) => {
    setFormData({
      email: account.email,
      password: account.password
    })
    setErrors({})
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        handleSubmit(e)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [formData])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-astra flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-astra flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo and Header */}
        <div className="text-center">
          <div className="mx-auto h-20 w-20 bg-white rounded-full flex items-center justify-center shadow-lg">
            <Building2 className="h-10 w-10 text-astra-600" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-white">
            AstraCore Solutions
          </h2>
          <p className="mt-2 text-sm text-astra-100">
            Přihlaste se do interního systému
          </p>
        </div>

        {/* Reset Password Success */}
        {resetEmailSent && (
          <div className="bg-white rounded-lg p-4 shadow-lg">
            <div className="flex items-center space-x-2 text-success-600">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Email odeslán!</span>
            </div>
            <p className="mt-1 text-sm text-gray-600">
              Zkontrolujte svou emailovou schránku a postupujte podle instrukcí.
            </p>
          </div>
        )}

        {/* Login Form */}
        <div className="bg-white rounded-xl shadow-2xl p-8">
          {showForgotPassword ? (
            // Forgot Password Form
            <form className="space-y-6" onSubmit={handleForgotPassword}>
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Reset hesla
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Zadejte svůj email a my vám pošleme odkaz pro reset hesla.
                </p>
              </div>

              <div>
                <label htmlFor="reset-email" className="form-label">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="reset-email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`input pl-10 ${errors.email ? 'input-error' : ''}`}
                    placeholder="vas.email@example.com"
                  />
                </div>
                {errors.email && (
                  <p className="form-error">{errors.email}</p>
                )}
              </div>

              {errors.general && (
                <div className="bg-error-50 border border-error-200 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 text-error-500" />
                    <span className="text-sm text-error-800">{errors.general}</span>
                  </div>
                </div>
              )}

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(false)}
                  className="btn-secondary flex-1"
                  disabled={isLoading}
                >
                  Zpět
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1"
                  disabled={isLoading}
                >
                  {isLoading ? <LoadingSpinner size="sm" /> : 'Odeslat'}
                </button>
              </div>
            </form>
          ) : (
            // Login Form
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="form-label">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`input pl-10 ${errors.email ? 'input-error' : ''}`}
                    placeholder="vas.email@astracore.pro"
                  />
                </div>
                {errors.email && (
                  <p className="form-error">{errors.email}</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="form-label">
                  Heslo
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`input pl-10 pr-10 ${errors.password ? 'input-error' : ''}`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="form-error">{errors.password}</p>
                )}
              </div>

              {errors.general && (
                <div className="bg-error-50 border border-error-200 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 text-error-500" />
                    <span className="text-sm text-error-800">{errors.general}</span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-astra-600 focus:ring-astra-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-600">Zapamatovat si mě</span>
                </label>

                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm text-astra-600 hover:text-astra-500"
                >
                  Zapomenuté heslo?
                </button>
              </div>

              <button
                type="submit"
                className="btn-primary w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <LoadingSpinner size="sm" />
                    <span className="ml-2">Přihlašování...</span>
                  </div>
                ) : (
                  'Přihlásit se'
                )}
              </button>

              <div className="text-center text-sm text-gray-600">
                <kbd className="bg-gray-100 px-2 py-1 rounded text-xs">Ctrl</kbd> + 
                <kbd className="bg-gray-100 px-2 py-1 rounded text-xs ml-1">Enter</kbd>
                <span className="ml-2">pro rychlé přihlášení</span>
              </div>
            </form>
          )}
        </div>

        {/* Demo Accounts (Development only) */}
        {import.meta.env.DEV && !showForgotPassword && (
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-4">
            <h3 className="text-white font-medium mb-3 text-center">Demo účty</h3>
            <div className="grid grid-cols-1 gap-2">
              {demoAccounts.map((account, index) => (
                <button
                  key={index}
                  onClick={() => fillDemoAccount(account)}
                  className="text-left p-2 rounded bg-white bg-opacity-10 hover:bg-opacity-20 transition-colors text-white text-sm"
                >
                  <div className="font-medium">{account.role}</div>
                  <div className="text-xs text-astra-100">{account.email}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-astra-100 text-sm">
          <p>© 2025 AstraCore Solutions. Všechna práva vyhrazena.</p>
          <p className="mt-1">
            Interní systém pro správu stavební firmy
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
