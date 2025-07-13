import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useTheme } from '../../context/ThemeContext'
import { supabase, dbOperations, TABLES } from '../../utils/supabase'
import { cn, formatCurrency, formatDate } from '../../utils/helpers'
import {
  Settings, User, Bell, Shield, Palette, Database, Download,
  Upload, RefreshCw, Save, Eye, EyeOff, Edit, Trash2, Plus,
  Check, X, AlertTriangle, Info, Lock, Key, Mail, Phone,
  Globe, Calendar, DollarSign, Percent, Building2, Users,
  FileText, Camera, Monitor, Smartphone, Sun, Moon
} from 'lucide-react'
import LoadingSpinner from '../ui/LoadingSpinner'
import toast from 'react-hot-toast'

const SettingsPage = () => {
  const { section } = useParams()
  const navigate = useNavigate()
  const { user, profile, updateProfile, hasPermission, signOut } = useAuth()
  const { 
    theme, 
    toggleTheme, 
    preferences, 
    updatePreferences, 
    resetPreferences,
    sidebarCollapsed,
    toggleSidebar
  } = useTheme()
  
  const [activeSection, setActiveSection] = useState(section || 'profile')
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState(null)
  
  // Form states
  const [profileForm, setProfileForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    avatar_url: ''
  })
  
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  })
  
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })
  
  const [companySettings, setCompanySettings] = useState({
    company_name: 'AstraCore Solutions',
    company_address: '',
    company_phone: '',
    company_email: '',
    company_website: '',
    company_logo: '',
    tax_id: '',
    vat_number: '',
    default_vat_rate: 21,
    default_currency: 'CZK',
    fiscal_year_start: 'january'
  })

  // Navigation sections
  const sections = [
    { 
      id: 'profile', 
      label: 'Můj profil', 
      icon: User,
      permission: null 
    },
    { 
      id: 'notifications', 
      label: 'Oznámení', 
      icon: Bell,
      permission: null 
    },
    { 
      id: 'appearance', 
      label: 'Vzhled', 
      icon: Palette,
      permission: null 
    },
    { 
      id: 'company', 
      label: 'Firma', 
      icon: Building2,
      permission: 'SYSTEM_SETTINGS' 
    },
    { 
      id: 'users', 
      label: 'Uživatelé', 
      icon: Users,
      permission: 'USER_MANAGEMENT' 
    },
    { 
      id: 'security', 
      label: 'Zabezpečení', 
      icon: Shield,
      permission: 'SYSTEM_SETTINGS' 
    },
    { 
      id: 'data', 
      label: 'Data', 
      icon: Database,
      permission: 'SYSTEM_SETTINGS' 
    }
  ]

  // Filter sections based on permissions
  const visibleSections = sections.filter(section => 
    !section.permission || hasPermission(section.permission)
  )

  // Initialize form data
  useEffect(() => {
    if (user && profile) {
      setProfileForm({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        email: user.email || '',
        phone: profile.phone || '',
        address: profile.address || '',
        avatar_url: profile.avatar_url || ''
      })
    }
  }, [user, profile])

  // Navigation
  useEffect(() => {
    if (section && section !== activeSection) {
      setActiveSection(section)
    }
  }, [section])

  const navigateToSection = (sectionId) => {
    setActiveSection(sectionId)
    navigate(`/nastaveni/${sectionId}`, { replace: true })
  }

  // Save profile
  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setIsSaving(true)
    setError(null)

    try {
      // Update profile
      const result = await updateProfile({
        first_name: profileForm.first_name,
        last_name: profileForm.last_name,
        phone: profileForm.phone,
        address: profileForm.address,
        avatar_url: profileForm.avatar_url
      })

      if (result.success) {
        toast.success('Profil byl aktualizován')
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      setError(error.message)
      toast.error('Chyba při aktualizaci profilu')
    } finally {
      setIsSaving(false)
    }
  }

  // Change password
  const handleChangePassword = async (e) => {
    e.preventDefault()
    setIsSaving(true)
    setError(null)

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setError('Nová hesla se neshodují')
      setIsSaving(false)
      return
    }

    if (passwordForm.new_password.length < 6) {
      setError('Nové heslo musí mít alespoň 6 znaků')
      setIsSaving(false)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.new_password
      })

      if (error) throw error

      setPasswordForm({
        current_password: '',
        new_password: '',
        confirm_password: ''
      })

      toast.success('Heslo bylo změněno')
    } catch (error) {
      console.error('Error changing password:', error)
      setError(error.message)
      toast.error('Chyba při změně hesla')
    } finally {
      setIsSaving(false)
    }
  }

  // Save company settings
  const handleSaveCompanySettings = async (e) => {
    e.preventDefault()
    setIsSaving(true)
    setError(null)

    try {
      // In real app, save to company_settings table
      toast.success('Nastavení společnosti bylo uloženo')
    } catch (error) {
      console.error('Error saving company settings:', error)
      setError(error.message)
      toast.error('Chyba při ukládání nastavení')
    } finally {
      setIsSaving(false)
    }
  }

  // Handle preference updates
  const handlePreferenceUpdate = (key, value) => {
    updatePreferences(key, value)
    toast.success('Nastavení bylo uloženo')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen-50">
        <LoadingSpinner size="lg" text="Načítání nastavení..." />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <Settings className="h-8 w-8 text-astra-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nastavení</h1>
          <p className="text-gray-600">Správa účtu a aplikačních nastavení</p>
        </div>
      </div>

      {/* Navigation */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <nav className="space-y-1">
            {visibleSections.map((section) => (
              <button
                key={section.id}
                onClick={() => navigateToSection(section.id)}
                className={cn(
                  'w-full flex items-center space-x-3 px-4 py-3 text-left rounded-lg transition-colors',
                  activeSection === section.id
                    ? 'bg-astra-50 text-astra-600 font-medium'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <section.icon className="h-5 w-5" />
                <span>{section.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <div className="card p-6">
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-red-800">{error}</span>
                </div>
              </div>
            )}

            {/* Profile Section */}
            {activeSection === 'profile' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Můj profil</h2>
                  <p className="text-gray-600 mb-6">Upravte své osobní údaje a kontaktní informace</p>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="form-group">
                      <label className="form-label">Jméno</label>
                      <input
                        type="text"
                        value={profileForm.first_name}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, first_name: e.target.value }))}
                        className="input"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Příjmení</label>
                      <input
                        type="text"
                        value={profileForm.last_name}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, last_name: e.target.value }))}
                        className="input"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Email</label>
                      <input
                        type="email"
                        value={profileForm.email}
                        disabled
                        className="input bg-gray-50"
                      />
                      <p className="text-xs text-gray-500 mt-1">Email nelze změnit</p>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Telefon</label>
                      <input
                        type="tel"
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                        className="input"
                        placeholder="+420 123 456 789"
                      />
                    </div>

                    <div className="form-group md:col-span-2">
                      <label className="form-label">Adresa</label>
                      <input
                        type="text"
                        value={profileForm.address}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, address: e.target.value }))}
                        className="input"
                        placeholder="Ulice, město, PSČ"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button type="submit" disabled={isSaving} className="btn-primary">
                      {isSaving ? <LoadingSpinner size="sm" /> : <Save className="h-4 w-4 mr-2" />}
                      Uložit změny
                    </button>
                  </div>
                </form>

                {/* Password Change */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Změna hesla</h3>
                  
                  <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                    <div className="form-group">
                      <label className="form-label">Současné heslo</label>
                      <div className="relative">
                        <input
                          type={showPasswords.current ? 'text' : 'password'}
                          value={passwordForm.current_password}
                          onChange={(e) => setPasswordForm(prev => ({ ...prev, current_password: e.target.value }))}
                          className="input pr-10"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                        >
                          {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Nové heslo</label>
                      <div className="relative">
                        <input
                          type={showPasswords.new ? 'text' : 'password'}
                          value={passwordForm.new_password}
                          onChange={(e) => setPasswordForm(prev => ({ ...prev, new_password: e.target.value }))}
                          className="input pr-10"
                          required
                          minLength={6}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                        >
                          {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Potvrdit nové heslo</label>
                      <div className="relative">
                        <input
                          type={showPasswords.confirm ? 'text' : 'password'}
                          value={passwordForm.confirm_password}
                          onChange={(e) => setPasswordForm(prev => ({ ...prev, confirm_password: e.target.value }))}
                          className="input pr-10"
                          required
                          minLength={6}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                        >
                          {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <button type="submit" disabled={isSaving} className="btn-primary">
                      {isSaving ? <LoadingSpinner size="sm" /> : <Key className="h-4 w-4 mr-2" />}
                      Změnit heslo
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* Notifications Section */}
            {activeSection === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Oznámení</h2>
                  <p className="text-gray-600 mb-6">Spravujte, kdy a jak chcete dostávat oznámení</p>
                </div>

                <div className="space-y-6">
                  {/* Email Notifications */}
                  <div>
                    <h3 className="text-base font-medium text-gray-900 mb-3">Email oznámení</h3>
                    <div className="space-y-3">
                      {[
                        { key: 'email', label: 'Povolit email oznámení', description: 'Dostávat oznámení na email' },
                        { key: 'deadlines', label: 'Termíny a deadliny', description: 'Upozornění na blížící se termíny' },
                        { key: 'expenses', label: 'Nové náklady', description: 'Oznámení o nových nákladech a fakturách' },
                        { key: 'team', label: 'Týmová aktivita', description: 'Aktualizace od členů týmu' }
                      ].map((item) => (
                        <div key={item.key} className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{item.label}</p>
                            <p className="text-sm text-gray-600">{item.description}</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={preferences.notifications?.[item.key] || false}
                              onChange={(e) => handlePreferenceUpdate(`notifications.${item.key}`, e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-astra-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-astra-600"></div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Push Notifications */}
                  <div>
                    <h3 className="text-base font-medium text-gray-900 mb-3">Push oznámení</h3>
                    <div className="space-y-3">
                      {[
                        { key: 'push', label: 'Povolit push oznámení', description: 'Okamžitá oznámení v prohlížeči' },
                        { key: 'desktop', label: 'Desktop oznámení', description: 'Oznámení na ploše' }
                      ].map((item) => (
                        <div key={item.key} className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{item.label}</p>
                            <p className="text-sm text-gray-600">{item.description}</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={preferences.notifications?.[item.key] || false}
                              onChange={(e) => handlePreferenceUpdate(`notifications.${item.key}`, e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-astra-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-astra-600"></div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Appearance Section */}
            {activeSection === 'appearance' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Vzhled</h2>
                  <p className="text-gray-600 mb-6">Přizpůsobte si vzhled aplikace podle svých preferencí</p>
                </div>

                <div className="space-y-6">
                  {/* Theme */}
                  <div>
                    <h3 className="text-base font-medium text-gray-900 mb-3">Téma</h3>
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={toggleTheme}
                        className={cn(
                          'flex items-center space-x-3 p-4 border-2 rounded-lg transition-colors',
                          theme === 'light' 
                            ? 'border-astra-500 bg-astra-50 text-astra-700'
                            : 'border-gray-200 hover:border-gray-300'
                        )}
                      >
                        <Sun className="h-5 w-5" />
                        <span className="font-medium">Světlé</span>
                      </button>
                      
                      <button
                        onClick={toggleTheme}
                        className={cn(
                          'flex items-center space-x-3 p-4 border-2 rounded-lg transition-colors',
                          theme === 'dark' 
                            ? 'border-astra-500 bg-astra-50 text-astra-700'
                            : 'border-gray-200 hover:border-gray-300'
                        )}
                      >
                        <Moon className="h-5 w-5" />
                        <span className="font-medium">Tmavé</span>
                      </button>
                    </div>
                  </div>

                  {/* Sidebar */}
                  <div>
                    <h3 className="text-base font-medium text-gray-900 mb-3">Boční panel</h3>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Sbalit boční panel</p>
                        <p className="text-sm text-gray-600">Více místa pro obsah</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={sidebarCollapsed}
                          onChange={toggleSidebar}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-astra-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-astra-600"></div>
                      </label>
                    </div>
                  </div>

                  {/* Language and Format */}
                  <div>
                    <h3 className="text-base font-medium text-gray-900 mb-3">Jazyk a formát</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="form-label">Jazyk</label>
                        <select 
                          value={preferences.language || 'cs'}
                          onChange={(e) => handlePreferenceUpdate('language', e.target.value)}
                          className="input"
                        >
                          <option value="cs">Čeština</option>
                          <option value="en">English</option>
                        </select>
                      </div>

                      <div>
                        <label className="form-label">Formát data</label>
                        <select 
                          value={preferences.dateFormat || 'dd.MM.yyyy'}
                          onChange={(e) => handlePreferenceUpdate('dateFormat', e.target.value)}
                          className="input"
                        >
                          <option value="dd.MM.yyyy">DD.MM.YYYY</option>
                          <option value="MM/dd/yyyy">MM/DD/YYYY</option>
                          <option value="yyyy-MM-dd">YYYY-MM-DD</option>
                        </select>
                      </div>

                      <div>
                        <label className="form-label">Formát času</label>
                        <select 
                          value={preferences.timeFormat || '24h'}
                          onChange={(e) => handlePreferenceUpdate('timeFormat', e.target.value)}
                          className="input"
                        >
                          <option value="24h">24 hodin</option>
                          <option value="12h">12 hodin</option>
                        </select>
                      </div>

                      <div>
                        <label className="form-label">Měna</label>
                        <select 
                          value={preferences.currency || 'CZK'}
                          onChange={(e) => handlePreferenceUpdate('currency', e.target.value)}
                          className="input"
                        >
                          <option value="CZK">CZK (Kč)</option>
                          <option value="EUR">EUR (€)</option>
                          <option value="USD">USD ($)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Company Section */}
            {activeSection === 'company' && hasPermission('SYSTEM_SETTINGS') && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Nastavení společnosti</h2>
                  <p className="text-gray-600 mb-6">Základní informace o vaší společnosti</p>
                </div>

                <form onSubmit={handleSaveCompanySettings} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="form-group">
                      <label className="form-label">Název společnosti</label>
                      <input
                        type="text"
                        value={companySettings.company_name}
                        onChange={(e) => setCompanySettings(prev => ({ ...prev, company_name: e.target.value }))}
                        className="input"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">IČO</label>
                      <input
                        type="text"
                        value={companySettings.tax_id}
                        onChange={(e) => setCompanySettings(prev => ({ ...prev, tax_id: e.target.value }))}
                        className="input"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">DIČ</label>
                      <input
                        type="text"
                        value={companySettings.vat_number}
                        onChange={(e) => setCompanySettings(prev => ({ ...prev, vat_number: e.target.value }))}
                        className="input"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Výchozí sazba DPH (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={companySettings.default_vat_rate}
                        onChange={(e) => setCompanySettings(prev => ({ ...prev, default_vat_rate: parseFloat(e.target.value) }))}
                        className="input"
                      />
                    </div>

                    <div className="form-group md:col-span-2">
                      <label className="form-label">Adresa</label>
                      <textarea
                        value={companySettings.company_address}
                        onChange={(e) => setCompanySettings(prev => ({ ...prev, company_address: e.target.value }))}
                        className="input"
                        rows={3}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Telefon</label>
                      <input
                        type="tel"
                        value={companySettings.company_phone}
                        onChange={(e) => setCompanySettings(prev => ({ ...prev, company_phone: e.target.value }))}
                        className="input"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Email</label>
                      <input
                        type="email"
                        value={companySettings.company_email}
                        onChange={(e) => setCompanySettings(prev => ({ ...prev, company_email: e.target.value }))}
                        className="input"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Webové stránky</label>
                      <input
                        type="url"
                        value={companySettings.company_website}
                        onChange={(e) => setCompanySettings(prev => ({ ...prev, company_website: e.target.value }))}
                        className="input"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Začátek fiskálního roku</label>
                      <select
                        value={companySettings.fiscal_year_start}
                        onChange={(e) => setCompanySettings(prev => ({ ...prev, fiscal_year_start: e.target.value }))}
                        className="input"
                      >
                        <option value="january">Leden</option>
                        <option value="april">Duben</option>
                        <option value="july">Červenec</option>
                        <option value="october">Říjen</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button type="submit" disabled={isSaving} className="btn-primary">
                      {isSaving ? <LoadingSpinner size="sm" /> : <Save className="h-4 w-4 mr-2" />}
                      Uložit nastavení
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Placeholder sections for other tabs */}
            {['users', 'security', 'data'].includes(activeSection) && (
              <div className="text-center py-12">
                <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {activeSection === 'users' && 'Správa uživatelů'}
                  {activeSection === 'security' && 'Zabezpečení'}
                  {activeSection === 'data' && 'Správa dat'}
                </h3>
                <p className="text-gray-600">Tato sekce bude brzy k dispozici</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage
