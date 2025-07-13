import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useTheme } from '../../context/ThemeContext'
import { supabase, dbOperations, TABLES } from '../../utils/supabase'
import { cn, formatCurrency, formatDate, calculatePercentage } from '../../utils/helpers'
import {
  Building, Home, Plus, Search, Filter, Eye, Edit, Trash2, MapPin,
  Users, DollarSign, Calendar, TrendingUp, TrendingDown, Target,
  AlertTriangle, CheckCircle, Clock, Star, Award, RefreshCw,
  Phone, Mail, FileText, Camera, Download, Building2, Key,
  CreditCard, Receipt, Settings, UserCheck, UserX, Euro
} from 'lucide-react'
import LoadingSpinner, { TableSkeleton } from '../ui/LoadingSpinner'
import toast from 'react-hot-toast'

const PropertiesPage = () => {
  const navigate = useNavigate()
  const { hasPermission } = useAuth()
  const { formatCurrency: themeCurrency } = useTheme()
  const [searchParams, setSearchParams] = useSearchParams()
  
  const [properties, setProperties] = useState([])
  const [tenants, setTenants] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('properties')
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
  const [typeFilter, setTypeFilter] = useState(searchParams.get('type') || 'all')
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all')
  const [ownershipFilter, setOwnershipFilter] = useState(searchParams.get('ownership') || 'all')

  // Permission check
  useEffect(() => {
    if (!hasPermission('VIEW_PROPERTIES')) {
      toast.error('Nemáte oprávnění k zobrazení nemovitostí')
      navigate('/dashboard')
      return
    }
  }, [hasPermission, navigate])

  // Fetch properties
  const fetchProperties = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from(TABLES.PROPERTIES)
        .select(`
          *,
          tenants:property_tenants(
            id,
            tenant_name,
            tenant_email,
            tenant_phone,
            monthly_rent,
            deposit,
            lease_start,
            lease_end,
            status
          )
        `)
        .order('name', { ascending: true })

      if (error) throw error

      // Calculate additional stats for each property
      const propertiesWithStats = data.map(property => {
        const activeTenants = property.tenants?.filter(t => t.status === 'active') || []
        const totalUnits = property.total_units || 1
        const occupiedUnits = activeTenants.length
        const occupancyRate = (occupiedUnits / totalUnits) * 100
        
        const monthlyRentIncome = activeTenants.reduce((sum, t) => sum + (t.monthly_rent || 0), 0)
        const annualRentIncome = monthlyRentIncome * 12
        
        // Calculate yield (rental yield = annual rent / property value * 100)
        const rentalYield = property.market_value ? (annualRentIncome / property.market_value) * 100 : 0
        
        // Calculate expenses (basic estimate - in real app would be from actual data)
        const estimatedExpenses = property.market_value ? property.market_value * 0.02 : 0 // 2% of property value
        const netIncome = annualRentIncome - estimatedExpenses
        const netYield = property.market_value ? (netIncome / property.market_value) * 100 : 0

        return {
          ...property,
          activeTenants,
          occupiedUnits,
          occupancyRate,
          monthlyRentIncome,
          annualRentIncome,
          rentalYield,
          netYield,
          estimatedExpenses,
          netIncome
        }
      })

      setProperties(propertiesWithStats)

    } catch (error) {
      console.error('Error fetching properties:', error)
      setError(error.message)
      toast.error('Chyba při načítání nemovitostí')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  // Fetch tenants
  const fetchTenants = async () => {
    try {
      const { data, error } = await supabase
        .from(TABLES.PROPERTY_TENANTS)
        .select(`
          *,
          property:properties(id, name, address, type)
        `)
        .order('tenant_name', { ascending: true })

      if (error) throw error
      setTenants(data || [])
    } catch (error) {
      console.error('Error fetching tenants:', error)
      toast.error('Chyba při načítání nájemníků')
    }
  }

  // Initial load
  useEffect(() => {
    fetchProperties()
    if (activeTab === 'tenants') {
      fetchTenants()
    }
  }, [activeTab])

  // Refresh data
  const handleRefresh = () => {
    setIsRefreshing(true)
    if (activeTab === 'properties') {
      fetchProperties()
    } else {
      fetchTenants()
    }
  }

  // Filter properties
  const filteredProperties = properties.filter(property => {
    const matchesSearch = !searchQuery || 
      property.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.city?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesType = typeFilter === 'all' || property.type === typeFilter
    const matchesStatus = statusFilter === 'all' || property.status === statusFilter
    const matchesOwnership = ownershipFilter === 'all' || property.ownership_type === ownershipFilter

    return matchesSearch && matchesType && matchesStatus && matchesOwnership
  })

  // Filter tenants
  const filteredTenants = tenants.filter(tenant => {
    const matchesSearch = !searchQuery ||
      tenant.tenant_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant.tenant_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant.property?.name.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === 'all' || tenant.status === statusFilter

    return matchesSearch && matchesStatus
  })

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams()
    if (searchQuery) params.set('search', searchQuery)
    if (typeFilter !== 'all') params.set('type', typeFilter)
    if (statusFilter !== 'all') params.set('status', statusFilter)
    if (ownershipFilter !== 'all') params.set('ownership', ownershipFilter)
    
    setSearchParams(params, { replace: true })
  }, [searchQuery, typeFilter, statusFilter, ownershipFilter])

  // Delete property
  const handleDeleteProperty = async (propertyId) => {
    if (!hasPermission('EDIT_PROPERTIES')) {
      toast.error('Nemáte oprávnění mazat nemovitosti')
      return
    }

    const property = properties.find(p => p.id === propertyId)
    if (!confirm(`Opravdu chcete smazat nemovitost "${property?.name}"? Tato akce nelze vrátit zpět.`)) {
      return
    }

    try {
      const { error } = await dbOperations.delete(TABLES.PROPERTIES, propertyId)
      if (error) throw error

      setProperties(prev => prev.filter(p => p.id !== propertyId))
      toast.success('Nemovitost byla smazána')
    } catch (error) {
      console.error('Error deleting property:', error)
      toast.error('Chyba při mazání nemovitosti')
    }
  }

  // Update tenant status
  const updateTenantStatus = async (tenantId, newStatus) => {
    if (!hasPermission('EDIT_PROPERTIES')) {
      toast.error('Nemáte oprávnění upravovat nájemníky')
      return
    }

    try {
      const { data, error } = await dbOperations.update(TABLES.PROPERTY_TENANTS, tenantId, {
        status: newStatus
      })
      
      if (error) throw error
      
      setTenants(prev => prev.map(tenant => 
        tenant.id === tenantId ? { ...tenant, status: newStatus } : tenant
      ))
      
      toast.success('Stav nájemníka byl aktualizován')
    } catch (error) {
      console.error('Error updating tenant status:', error)
      toast.error('Chyba při aktualizaci stavu nájemníka')
    }
  }

  // Get property status config
  const getPropertyStatusConfig = (status) => {
    const configs = {
      available: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Dostupná' },
      rented: { color: 'bg-blue-100 text-blue-800', icon: Key, label: 'Pronajatá' },
      maintenance: { color: 'bg-yellow-100 text-yellow-800', icon: Settings, label: 'Údržba' },
      sold: { color: 'bg-purple-100 text-purple-800', icon: Building, label: 'Prodaná' },
      inactive: { color: 'bg-gray-100 text-gray-800', icon: Clock, label: 'Neaktivní' }
    }
    return configs[status] || configs.available
  }

  // Get tenant status config
  const getTenantStatusConfig = (status) => {
    const configs = {
      active: { color: 'bg-green-100 text-green-800', icon: UserCheck, label: 'Aktivní' },
      notice: { color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle, label: 'Výpověď' },
      terminated: { color: 'bg-red-100 text-red-800', icon: UserX, label: 'Ukončen' },
      overdue: { color: 'bg-red-100 text-red-800', icon: CreditCard, label: 'Dluh' }
    }
    return configs[status] || configs.active
  }

  // Calculate portfolio statistics
  const portfolioStats = {
    totalProperties: properties.length,
    totalValue: properties.reduce((sum, p) => sum + (p.market_value || 0), 0),
    totalMonthlyRent: properties.reduce((sum, p) => sum + p.monthlyRentIncome, 0),
    totalAnnualRent: properties.reduce((sum, p) => sum + p.annualRentIncome, 0),
    averageOccupancy: properties.length > 0 
      ? properties.reduce((sum, p) => sum + p.occupancyRate, 0) / properties.length 
      : 0,
    averageYield: properties.length > 0 
      ? properties.reduce((sum, p) => sum + p.rentalYield, 0) / properties.length 
      : 0,
    totalTenants: properties.reduce((sum, p) => sum + p.activeTenants.length, 0),
    ownedProperties: properties.filter(p => p.ownership_type === 'owned').length,
    managedProperties: properties.filter(p => p.ownership_type === 'managed').length
  }

  const tabs = [
    { id: 'properties', label: 'Nemovitosti', icon: Building },
    { id: 'tenants', label: 'Nájemníci', icon: Users },
    { id: 'income', label: 'Příjmy', icon: DollarSign },
    { id: 'maintenance', label: 'Údržba', icon: Settings }
  ]

  if (isLoading && properties.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Nemovitosti</h1>
        </div>
        <TableSkeleton rows={8} columns={6} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Chyba při načítání</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button onClick={handleRefresh} className="btn-primary">
          Zkusit znovu
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
        <div className="flex items-center space-x-3">
          <Building className="h-8 w-8 text-astra-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Nemovitosti</h1>
            <p className="text-gray-600">Správa portfolia nemovitostí a nájemníků</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="btn-secondary"
          >
            <RefreshCw className={cn('h-4 w-4 mr-2', isRefreshing && 'animate-spin')} />
            Obnovit
          </button>
          
          {hasPermission('EDIT_PROPERTIES') && (
            <Link to="/nemovitosti/nova" className="btn-primary">
              <Plus className="h-4 w-4 mr-2" />
              Nová nemovitost
            </Link>
          )}
        </div>
      </div>

      {/* Portfolio Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Celkem nemovitostí</p>
              <p className="text-xl font-bold text-gray-900">{portfolioStats.totalProperties}</p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Euro className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Hodnota portfolia</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(portfolioStats.totalValue)}</p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Měsíční příjem</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(portfolioStats.totalMonthlyRent)}</p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Průměrný výnos</p>
              <p className="text-xl font-bold text-gray-900">{portfolioStats.averageYield.toFixed(1)}%</p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Users className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Aktivní nájemníci</p>
              <p className="text-xl font-bold text-gray-900">{portfolioStats.totalTenants}</p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Target className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Obsazenost</p>
              <p className="text-xl font-bold text-gray-900">{portfolioStats.averageOccupancy.toFixed(1)}%</p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
              <Home className="h-5 w-5 text-teal-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Vlastní</p>
              <p className="text-xl font-bold text-gray-900">{portfolioStats.ownedProperties}</p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
              <Building2 className="h-5 w-5 text-pink-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Spravované</p>
              <p className="text-xl font-bold text-gray-900">{portfolioStats.managedProperties}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap',
                activeTab === tab.id
                  ? 'border-astra-500 text-astra-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              )}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder={`Hledat ${activeTab === 'properties' ? 'nemovitosti' : 'nájemníky'}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input pl-10"
              />
            </div>
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input w-auto"
          >
            <option value="all">Všechny stavy</option>
            {activeTab === 'properties' ? (
              <>
                <option value="available">Dostupná</option>
                <option value="rented">Pronajatá</option>
                <option value="maintenance">Údržba</option>
                <option value="sold">Prodaná</option>
                <option value="inactive">Neaktivní</option>
              </>
            ) : (
              <>
                <option value="active">Aktivní</option>
                <option value="notice">Výpověď</option>
                <option value="terminated">Ukončen</option>
                <option value="overdue">Dluh</option>
              </>
            )}
          </select>

          {activeTab === 'properties' && (
            <>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="input w-auto"
              >
                <option value="all">Všechny typy</option>
                <option value="apartment">Byt</option>
                <option value="house">Dům</option>
                <option value="office">Kancelář</option>
                <option value="retail">Obchod</option>
                <option value="warehouse">Sklad</option>
                <option value="land">Pozemek</option>
              </select>

              <select
                value={ownershipFilter}
                onChange={(e) => setOwnershipFilter(e.target.value)}
                className="input w-auto"
              >
                <option value="all">Všechny vlastnictví</option>
                <option value="owned">Vlastní</option>
                <option value="managed">Spravované</option>
              </select>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="card overflow-hidden">
        {/* Properties Table */}
        {activeTab === 'properties' && (
          <>
            {filteredProperties.length === 0 ? (
              <div className="text-center py-12">
                <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchQuery || typeFilter !== 'all' || statusFilter !== 'all' || ownershipFilter !== 'all'
                    ? 'Žádné nemovitosti nevyhovují filtrům'
                    : 'Žádné nemovitosti'
                  }
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchQuery || typeFilter !== 'all' || statusFilter !== 'all' || ownershipFilter !== 'all'
                    ? 'Zkuste upravit filtry'
                    : 'Začněte přidáním první nemovitosti'
                  }
                </p>
                {hasPermission('EDIT_PROPERTIES') && (
                  <Link to="/nemovitosti/nova" className="btn-primary">
                    <Plus className="h-4 w-4 mr-2" />
                    Nová nemovitost
                  </Link>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table-auto-responsive">
                  <thead>
                    <tr>
                      <th>Nemovitost</th>
                      <th>Typ</th>
                      <th>Stav</th>
                      <th>Obsazenost</th>
                      <th>Měsíční příjem</th>
                      <th>Výnos</th>
                      <th>Akce</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProperties.map((property) => {
                      const statusConfig = getPropertyStatusConfig(property.status)
                      const StatusIcon = statusConfig.icon
                      
                      return (
                        <tr key={property.id} className="hover:bg-gray-50">
                          <td>
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Building className="h-5 w-5 text-blue-600" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{property.name}</p>
                                <p className="text-sm text-gray-600">{property.address}</p>
                                <p className="text-xs text-gray-500">
                                  {property.city} • {property.ownership_type === 'owned' ? 'Vlastní' : 'Spravované'}
                                </p>
                              </div>
                            </div>
                          </td>
                          
                          <td>
                            <span className="text-sm text-gray-900">
                              {property.type === 'apartment' && 'Byt'}
                              {property.type === 'house' && 'Dům'}
                              {property.type === 'office' && 'Kancelář'}
                              {property.type === 'retail' && 'Obchod'}
                              {property.type === 'warehouse' && 'Sklad'}
                              {property.type === 'land' && 'Pozemek'}
                            </span>
                          </td>
                          
                          <td>
                            <span className={cn('inline-flex items-center px-2 py-1 rounded-full text-xs font-medium', statusConfig.color)}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {statusConfig.label}
                            </span>
                          </td>
                          
                          <td>
                            <div className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span>{property.occupiedUnits}/{property.total_units || 1}</span>
                                <span className="font-medium">{property.occupancyRate.toFixed(0)}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${property.occupancyRate}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          
                          <td>
                            <div className="text-sm">
                              <p className="font-medium">{formatCurrency(property.monthlyRentIncome)}</p>
                              <p className="text-gray-600">ročně: {formatCurrency(property.annualRentIncome)}</p>
                            </div>
                          </td>
                          
                          <td>
                            <div className="text-sm">
                              <p className="font-medium text-green-600">{property.rentalYield.toFixed(2)}%</p>
                              <p className="text-gray-600">čistý: {property.netYield.toFixed(2)}%</p>
                            </div>
                          </td>
                          
                          <td>
                            <div className="flex items-center space-x-2">
                              <Link
                                to={`/nemovitosti/${property.id}`}
                                className="p-1 text-gray-400 hover:text-astra-600"
                                title="Zobrazit detail"
                              >
                                <Eye className="h-4 w-4" />
                              </Link>
                              
                              {hasPermission('EDIT_PROPERTIES') && (
                                <>
                                  <Link
                                    to={`/nemovitosti/${property.id}/edit`}
                                    className="p-1 text-gray-400 hover:text-blue-600"
                                    title="Upravit"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Link>
                                  
                                  <button
                                    onClick={() => handleDeleteProperty(property.id)}
                                    className="p-1 text-gray-400 hover:text-red-600"
                                    title="Smazat"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* Tenants Table */}
        {activeTab === 'tenants' && (
          <>
            {filteredTenants.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Žádní nájemníci</h3>
                <p className="text-gray-600">Zatím nejsou evidováni žádní nájemníci</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table-auto-responsive">
                  <thead>
                    <tr>
                      <th>Nájemník</th>
                      <th>Nemovitost</th>
                      <th>Stav</th>
                      <th>Nájemné</th>
                      <th>Smlouva</th>
                      <th>Akce</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTenants.map((tenant) => {
                      const statusConfig = getTenantStatusConfig(tenant.status)
                      const StatusIcon = statusConfig.icon
                      
                      return (
                        <tr key={tenant.id} className="hover:bg-gray-50">
                          <td>
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                <Users className="h-5 w-5 text-purple-600" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{tenant.tenant_name}</p>
                                <p className="text-sm text-gray-600">{tenant.tenant_email}</p>
                                <p className="text-xs text-gray-500">{tenant.tenant_phone}</p>
                              </div>
                            </div>
                          </td>
                          
                          <td>
                            <div>
                              <p className="font-medium text-gray-900">{tenant.property?.name}</p>
                              <p className="text-sm text-gray-600">{tenant.property?.address}</p>
                            </div>
                          </td>
                          
                          <td>
                            <span className={cn('inline-flex items-center px-2 py-1 rounded-full text-xs font-medium', statusConfig.color)}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {statusConfig.label}
                            </span>
                          </td>
                          
                          <td>
                            <div className="text-sm">
                              <p className="font-medium">{formatCurrency(tenant.monthly_rent)}</p>
                              <p className="text-gray-600">Kauce: {formatCurrency(tenant.deposit || 0)}</p>
                            </div>
                          </td>
                          
                          <td>
                            <div className="text-sm">
                              <p className="text-gray-900">Od: {formatDate(tenant.lease_start)}</p>
                              <p className="text-gray-600">Do: {formatDate(tenant.lease_end)}</p>
                            </div>
                          </td>
                          
                          <td>
                            <div className="flex items-center space-x-2">
                              <Link
                                to={`/nemovitosti/najemnici/${tenant.id}`}
                                className="p-1 text-gray-400 hover:text-astra-600"
                                title="Zobrazit detail"
                              >
                                <Eye className="h-4 w-4" />
                              </Link>
                              
                              {hasPermission('EDIT_PROPERTIES') && (
                                <Link
                                  to={`/nemovitosti/najemnici/${tenant.id}/edit`}
                                  className="p-1 text-gray-400 hover:text-blue-600"
                                  title="Upravit"
                                >
                                  <Edit className="h-4 w-4" />
                                </Link>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* Other tabs placeholder */}
        {(activeTab === 'income' || activeTab === 'maintenance') && (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {activeTab === 'income' ? 'Příjmy' : 'Údržba'}
            </h3>
            <p className="text-gray-600">Tato sekce bude brzy k dispozici</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default PropertiesPage
