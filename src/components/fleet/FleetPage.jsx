import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useTheme } from '../../context/ThemeContext'
import { supabase, dbOperations, TABLES } from '../../utils/supabase'
import { cn, formatCurrency, formatDate, formatNumber } from '../../utils/helpers'
import {
  Car, Wrench, Plus, Search, Filter, Eye, Edit, Trash2, MapPin,
  Calendar, DollarSign, AlertTriangle, CheckCircle, Clock, Settings,
  Fuel, Gauge, Zap, Target, RefreshCw, Download, QrCode, User,
  Building2, FileText, Camera, Star, Award, Tool
} from 'lucide-react'
import LoadingSpinner, { TableSkeleton } from '../ui/LoadingSpinner'
import toast from 'react-hot-toast'

const FleetPage = () => {
  const { section } = useParams()
  const navigate = useNavigate()
  const { hasPermission } = useAuth()
  const { formatCurrency: themeCurrency } = useTheme()
  
  const [activeSection, setActiveSection] = useState(section || 'vozidla')
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState(null)
  
  // Data states
  const [vehicles, setVehicles] = useState([])
  const [tools, setTools] = useState([])
  const [maintenance, setMaintenance] = useState([])
  const [assignments, setAssignments] = useState([])
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [locationFilter, setLocationFilter] = useState('all')

  // Permission check
  useEffect(() => {
    if (!hasPermission('VIEW_FLEET')) {
      toast.error('Nemáte oprávnění k zobrazení flotily a inventáře')
      navigate('/dashboard')
      return
    }
  }, [hasPermission, navigate])

  // Section navigation
  const sections = [
    { id: 'vozidla', label: 'Vozidla', icon: Car },
    { id: 'naradli', label: 'Nářadí', icon: Wrench },
    { id: 'udrzba', label: 'Údržba', icon: Settings },
    { id: 'prirazeni', label: 'Přiřazení', icon: User }
  ]

  // Fetch vehicles
  const fetchVehicles = async () => {
    try {
      const { data, error } = await supabase
        .from(TABLES.VEHICLES)
        .select(`
          *,
          current_user:employees(first_name, last_name),
          maintenance:vehicle_maintenance(
            id,
            maintenance_date,
            type,
            cost,
            description,
            next_service_date
          )
        `)
        .order('license_plate', { ascending: true })

      if (error) throw error

      // Calculate additional stats for each vehicle
      const vehiclesWithStats = data.map(vehicle => {
        const lastMaintenance = vehicle.maintenance
          ?.sort((a, b) => new Date(b.maintenance_date) - new Date(a.maintenance_date))[0]
        
        const yearlyMaintenanceCost = vehicle.maintenance
          ?.filter(m => {
            const date = new Date(m.maintenance_date)
            const currentYear = new Date().getFullYear()
            return date.getFullYear() === currentYear
          })
          .reduce((sum, m) => sum + (m.cost || 0), 0) || 0

        const needsService = lastMaintenance?.next_service_date && 
          new Date(lastMaintenance.next_service_date) <= new Date()

        return {
          ...vehicle,
          lastMaintenance,
          yearlyMaintenanceCost,
          needsService,
          daysSinceService: lastMaintenance 
            ? Math.floor((new Date() - new Date(lastMaintenance.maintenance_date)) / (1000 * 60 * 60 * 24))
            : null
        }
      })

      setVehicles(vehiclesWithStats)
    } catch (error) {
      console.error('Error fetching vehicles:', error)
      toast.error('Chyba při načítání vozidel')
    }
  }

  // Fetch tools
  const fetchTools = async () => {
    try {
      const { data, error } = await supabase
        .from(TABLES.TOOLS)
        .select(`
          *,
          current_user:employees(first_name, last_name),
          assignments:tool_assignments(
            id,
            assigned_date,
            returned_date,
            employee:employees(first_name, last_name),
            project:projects(name)
          )
        `)
        .order('name', { ascending: true })

      if (error) throw error

      // Calculate additional stats for each tool
      const toolsWithStats = data.map(tool => {
        const currentAssignment = tool.assignments?.find(a => !a.returned_date)
        const isAssigned = !!currentAssignment
        const needsCalibration = tool.last_calibration && 
          tool.calibration_interval &&
          new Date(tool.last_calibration).getTime() + (tool.calibration_interval * 24 * 60 * 60 * 1000) <= new Date().getTime()

        return {
          ...tool,
          currentAssignment,
          isAssigned,
          needsCalibration,
          assignedTo: currentAssignment?.employee,
          assignedProject: currentAssignment?.project
        }
      })

      setTools(toolsWithStats)
    } catch (error) {
      console.error('Error fetching tools:', error)
      toast.error('Chyba při načítání nářadí')
    }
  }

  // Fetch maintenance records
  const fetchMaintenance = async () => {
    try {
      const { data, error } = await supabase
        .from(TABLES.VEHICLE_MAINTENANCE)
        .select(`
          *,
          vehicle:vehicles(license_plate, brand, model),
          performed_by:user_profiles(first_name, last_name)
        `)
        .order('maintenance_date', { ascending: false })
        .limit(50)

      if (error) throw error
      setMaintenance(data || [])
    } catch (error) {
      console.error('Error fetching maintenance:', error)
      toast.error('Chyba při načítání údržby')
    }
  }

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        if (activeSection === 'vozidla') {
          await fetchVehicles()
        } else if (activeSection === 'naradli') {
          await fetchTools()
        } else if (activeSection === 'udrzba') {
          await fetchMaintenance()
        }
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [activeSection])

  // Refresh data
  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      if (activeSection === 'vozidla') {
        await fetchVehicles()
      } else if (activeSection === 'naradli') {
        await fetchTools()
      } else if (activeSection === 'udrzba') {
        await fetchMaintenance()
      }
    } finally {
      setIsRefreshing(false)
    }
  }

  // Navigation
  useEffect(() => {
    if (section && section !== activeSection) {
      setActiveSection(section)
    }
  }, [section])

  const navigateToSection = (sectionId) => {
    setActiveSection(sectionId)
    navigate(`/flotila/${sectionId}`, { replace: true })
  }

  // Update vehicle status
  const updateVehicleStatus = async (vehicleId, newStatus) => {
    if (!hasPermission('EDIT_FLEET')) {
      toast.error('Nemáte oprávnění upravovat vozidla')
      return
    }

    try {
      const { data, error } = await dbOperations.update(TABLES.VEHICLES, vehicleId, {
        status: newStatus
      })
      
      if (error) throw error
      
      setVehicles(prev => prev.map(vehicle => 
        vehicle.id === vehicleId ? { ...vehicle, status: newStatus } : vehicle
      ))
      
      toast.success('Stav vozidla byl aktualizován')
    } catch (error) {
      console.error('Error updating vehicle status:', error)
      toast.error('Chyba při aktualizaci stavu vozidla')
    }
  }

  // Delete vehicle
  const handleDeleteVehicle = async (vehicleId) => {
    if (!hasPermission('EDIT_FLEET')) {
      toast.error('Nemáte oprávnění mazat vozidla')
      return
    }

    const vehicle = vehicles.find(v => v.id === vehicleId)
    if (!confirm(`Opravdu chcete smazat vozidlo ${vehicle?.license_plate}?`)) {
      return
    }

    try {
      const { error } = await dbOperations.delete(TABLES.VEHICLES, vehicleId)
      if (error) throw error

      setVehicles(prev => prev.filter(v => v.id !== vehicleId))
      toast.success('Vozidlo bylo smazáno')
    } catch (error) {
      console.error('Error deleting vehicle:', error)
      toast.error('Chyba při mazání vozidla')
    }
  }

  // Delete tool
  const handleDeleteTool = async (toolId) => {
    if (!hasPermission('EDIT_FLEET')) {
      toast.error('Nemáte oprávnění mazat nářadí')
      return
    }

    const tool = tools.find(t => t.id === toolId)
    if (!confirm(`Opravdu chcete smazat nářadí "${tool?.name}"?`)) {
      return
    }

    try {
      const { error } = await dbOperations.delete(TABLES.TOOLS, toolId)
      if (error) throw error

      setTools(prev => prev.filter(t => t.id !== toolId))
      toast.success('Nářadí bylo smazáno')
    } catch (error) {
      console.error('Error deleting tool:', error)
      toast.error('Chyba při mazání nářadí')
    }
  }

  // Get status config
  const getVehicleStatusConfig = (status) => {
    const configs = {
      active: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Aktivní' },
      maintenance: { color: 'bg-yellow-100 text-yellow-800', icon: Settings, label: 'Údržba' },
      repair: { color: 'bg-red-100 text-red-800', icon: AlertTriangle, label: 'Oprava' },
      inactive: { color: 'bg-gray-100 text-gray-800', icon: Clock, label: 'Neaktivní' }
    }
    return configs[status] || configs.active
  }

  const getToolStatusConfig = (status) => {
    const configs = {
      available: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Dostupné' },
      assigned: { color: 'bg-blue-100 text-blue-800', icon: User, label: 'Přiřazeno' },
      maintenance: { color: 'bg-yellow-100 text-yellow-800', icon: Settings, label: 'Údržba' },
      broken: { color: 'bg-red-100 text-red-800', icon: AlertTriangle, label: 'Poškozené' },
      retired: { color: 'bg-gray-100 text-gray-800', icon: Clock, label: 'Vyřazeno' }
    }
    return configs[status] || configs.available
  }

  // Filter data
  const getFilteredData = () => {
    let data = []
    
    if (activeSection === 'vozidla') {
      data = vehicles
    } else if (activeSection === 'naradli') {
      data = tools
    } else if (activeSection === 'udrzba') {
      data = maintenance
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      data = data.filter(item => {
        if (activeSection === 'vozidla') {
          return item.license_plate?.toLowerCase().includes(query) ||
                 item.brand?.toLowerCase().includes(query) ||
                 item.model?.toLowerCase().includes(query)
        } else if (activeSection === 'naradli') {
          return item.name?.toLowerCase().includes(query) ||
                 item.brand?.toLowerCase().includes(query) ||
                 item.model?.toLowerCase().includes(query) ||
                 item.serial_number?.toLowerCase().includes(query)
        } else if (activeSection === 'udrzba') {
          return item.vehicle?.license_plate?.toLowerCase().includes(query) ||
                 item.description?.toLowerCase().includes(query)
        }
        return true
      })
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      data = data.filter(item => item.status === statusFilter)
    }

    // Apply type filter
    if (typeFilter !== 'all') {
      data = data.filter(item => item.type === typeFilter)
    }

    return data
  }

  const filteredData = getFilteredData()

  // Calculate statistics
  const getStatistics = () => {
    if (activeSection === 'vozidla') {
      const totalVehicles = vehicles.length
      const activeVehicles = vehicles.filter(v => v.status === 'active').length
      const vehiclesNeedingService = vehicles.filter(v => v.needsService).length
      const totalMaintenanceCost = vehicles.reduce((sum, v) => sum + v.yearlyMaintenanceCost, 0)
      
      return {
        total: totalVehicles,
        active: activeVehicles,
        needingService: vehiclesNeedingService,
        maintenanceCost: totalMaintenanceCost
      }
    } else if (activeSection === 'naradli') {
      const totalTools = tools.length
      const availableTools = tools.filter(t => t.status === 'available').length
      const assignedTools = tools.filter(t => t.isAssigned).length
      const needingCalibration = tools.filter(t => t.needsCalibration).length
      
      return {
        total: totalTools,
        available: availableTools,
        assigned: assignedTools,
        needingCalibration: needingCalibration
      }
    }
    
    return {}
  }

  const statistics = getStatistics()

  if (isLoading && filteredData.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Flotila & Inventář</h1>
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
          <Car className="h-8 w-8 text-astra-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Flotila & Inventář</h1>
            <p className="text-gray-600">Správa vozidel, nářadí a vybavení</p>
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
          
          {hasPermission('EDIT_FLEET') && (
            <Link
              to={`/flotila/${activeSection}/nova`}
              className="btn-primary"
            >
              <Plus className="h-4 w-4 mr-2" />
              {activeSection === 'vozidla' ? 'Nové vozidlo' : 
               activeSection === 'naradli' ? 'Nové nářadí' : 'Nová údržba'}
            </Link>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {sections.map((tab) => (
            <button
              key={tab.id}
              onClick={() => navigateToSection(tab.id)}
              className={cn(
                'flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap',
                activeSection === tab.id
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

      {/* Statistics Cards */}
      {(activeSection === 'vozidla' || activeSection === 'naradli') && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                {activeSection === 'vozidla' ? (
                  <Car className="h-5 w-5 text-blue-600" />
                ) : (
                  <Wrench className="h-5 w-5 text-blue-600" />
                )}
              </div>
              <div>
                <p className="text-sm text-gray-600">Celkem</p>
                <p className="text-xl font-bold text-gray-900">{statistics.total}</p>
              </div>
            </div>
          </div>

          <div className="card p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">
                  {activeSection === 'vozidla' ? 'Aktivní' : 'Dostupné'}
                </p>
                <p className="text-xl font-bold text-gray-900">
                  {activeSection === 'vozidla' ? statistics.active : statistics.available}
                </p>
              </div>
            </div>
          </div>

          <div className="card p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">
                  {activeSection === 'vozidla' ? 'Potřebuje servis' : 'Přiřazeno'}
                </p>
                <p className="text-xl font-bold text-gray-900">
                  {activeSection === 'vozidla' ? statistics.needingService : statistics.assigned}
                </p>
              </div>
            </div>
          </div>

          <div className="card p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">
                  {activeSection === 'vozidla' ? 'Údržba/rok' : 'Kalibrace'}
                </p>
                <p className="text-xl font-bold text-gray-900">
                  {activeSection === 'vozidla' 
                    ? formatCurrency(statistics.maintenanceCost) 
                    : statistics.needingCalibration
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder={`Hledat ${activeSection}...`}
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
            {activeSection === 'vozidla' ? (
              <>
                <option value="active">Aktivní</option>
                <option value="maintenance">Údržba</option>
                <option value="repair">Oprava</option>
                <option value="inactive">Neaktivní</option>
              </>
            ) : (
              <>
                <option value="available">Dostupné</option>
                <option value="assigned">Přiřazeno</option>
                <option value="maintenance">Údržba</option>
                <option value="broken">Poškozené</option>
                <option value="retired">Vyřazeno</option>
              </>
            )}
          </select>

          {activeSection === 'vozidla' && (
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="input w-auto"
            >
              <option value="all">Všechny typy</option>
              <option value="car">Osobní auto</option>
              <option value="van">Dodávka</option>
              <option value="truck">Nákladní auto</option>
              <option value="machinery">Stroj</option>
            </select>
          )}

          {activeSection === 'naradli' && (
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="input w-auto"
            >
              <option value="all">Všechny typy</option>
              <option value="hand_tool">Ruční nářadí</option>
              <option value="power_tool">Elektrické nářadí</option>
              <option value="measurement">Měřicí přístroj</option>
              <option value="safety">Bezpečnostní vybavení</option>
            </select>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="card overflow-hidden">
        {filteredData.length === 0 ? (
          <div className="text-center py-12">
            {activeSection === 'vozidla' ? (
              <Car className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            ) : (
              <Wrench className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            )}
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery || statusFilter !== 'all' || typeFilter !== 'all'
                ? `Žádné ${activeSection} nevyhovují filtrům`
                : `Žádné ${activeSection}`
              }
            </h3>
            <p className="text-gray-600 mb-4">
              {searchQuery || statusFilter !== 'all' || typeFilter !== 'all'
                ? 'Zkuste upravit filtry'
                : `Začněte přidáním prvního ${activeSection === 'vozidla' ? 'vozidla' : 'nářadí'}`
              }
            </p>
            {hasPermission('EDIT_FLEET') && (
              <Link
                to={`/flotila/${activeSection}/nova`}
                className="btn-primary"
              >
                <Plus className="h-4 w-4 mr-2" />
                {activeSection === 'vozidla' ? 'Nové vozidlo' : 'Nové nářadí'}
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            {/* Vehicles Table */}
            {activeSection === 'vozidla' && (
              <table className="table-auto-responsive">
                <thead>
                  <tr>
                    <th>Vozidlo</th>
                    <th>Stav</th>
                    <th>Uživatel</th>
                    <th>Poslední servis</th>
                    <th>Náklady/rok</th>
                    <th>Akce</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((vehicle) => {
                    const statusConfig = getVehicleStatusConfig(vehicle.status)
                    const StatusIcon = statusConfig.icon
                    
                    return (
                      <tr key={vehicle.id} className="hover:bg-gray-50">
                        <td>
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <Car className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{vehicle.license_plate}</p>
                              <p className="text-sm text-gray-600">{vehicle.brand} {vehicle.model}</p>
                              <p className="text-xs text-gray-500">Rok: {vehicle.year}</p>
                            </div>
                          </div>
                        </td>
                        
                        <td>
                          <div className="space-y-1">
                            <span className={cn('inline-flex items-center px-2 py-1 rounded-full text-xs font-medium', statusConfig.color)}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {statusConfig.label}
                            </span>
                            {vehicle.needsService && (
                              <div className="text-xs text-red-600">⚠️ Potřebuje servis</div>
                            )}
                          </div>
                        </td>
                        
                        <td>
                          {vehicle.current_user ? (
                            <span className="text-sm text-gray-900">
                              {vehicle.current_user.first_name} {vehicle.current_user.last_name}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-500">Nepřiřazeno</span>
                          )}
                        </td>
                        
                        <td>
                          {vehicle.lastMaintenance ? (
                            <div>
                              <p className="text-sm text-gray-900">{formatDate(vehicle.lastMaintenance.maintenance_date)}</p>
                              <p className="text-xs text-gray-500">před {vehicle.daysSinceService} dny</p>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-500">Žádný záznam</span>
                          )}
                        </td>
                        
                        <td>
                          <span className="font-medium">{formatCurrency(vehicle.yearlyMaintenanceCost)}</span>
                        </td>
                        
                        <td>
                          <div className="flex items-center space-x-2">
                            <Link
                              to={`/flotila/vozidla/${vehicle.id}`}
                              className="p-1 text-gray-400 hover:text-astra-600"
                              title="Zobrazit detail"
                            >
                              <Eye className="h-4 w-4" />
                            </Link>
                            
                            {hasPermission('EDIT_FLEET') && (
                              <>
                                <Link
                                  to={`/flotila/vozidla/${vehicle.id}/edit`}
                                  className="p-1 text-gray-400 hover:text-blue-600"
                                  title="Upravit"
                                >
                                  <Edit className="h-4 w-4" />
                                </Link>
                                
                                <button
                                  onClick={() => handleDeleteVehicle(vehicle.id)}
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
            )}

            {/* Tools Table */}
            {activeSection === 'naradli' && (
              <table className="table-auto-responsive">
                <thead>
                  <tr>
                    <th>Nářadí</th>
                    <th>Typ</th>
                    <th>Stav</th>
                    <th>Umístění</th>
                    <th>Přiřazeno</th>
                    <th>Akce</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((tool) => {
                    const statusConfig = getToolStatusConfig(tool.status)
                    const StatusIcon = statusConfig.icon
                    
                    return (
                      <tr key={tool.id} className="hover:bg-gray-50">
                        <td>
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                              <Wrench className="h-5 w-5 text-orange-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{tool.name}</p>
                              <p className="text-sm text-gray-600">{tool.brand} {tool.model}</p>
                              <p className="text-xs text-gray-500">SN: {tool.serial_number}</p>
                            </div>
                          </div>
                        </td>
                        
                        <td>
                          <span className="text-sm text-gray-900">{tool.type}</span>
                        </td>
                        
                        <td>
                          <div className="space-y-1">
                            <span className={cn('inline-flex items-center px-2 py-1 rounded-full text-xs font-medium', statusConfig.color)}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {statusConfig.label}
                            </span>
                            {tool.needsCalibration && (
                              <div className="text-xs text-red-600">⚠️ Kalibrace</div>
                            )}
                          </div>
                        </td>
                        
                        <td>
                          <span className="text-sm text-gray-900">{tool.location || 'Sklad'}</span>
                        </td>
                        
                        <td>
                          {tool.isAssigned ? (
                            <div>
                              <p className="text-sm text-gray-900">
                                {tool.assignedTo?.first_name} {tool.assignedTo?.last_name}
                              </p>
                              {tool.assignedProject && (
                                <p className="text-xs text-gray-500">{tool.assignedProject.name}</p>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-500">Nepřiřazeno</span>
                          )}
                        </td>
                        
                        <td>
                          <div className="flex items-center space-x-2">
                            <Link
                              to={`/flotila/naradli/${tool.id}`}
                              className="p-1 text-gray-400 hover:text-astra-600"
                              title="Zobrazit detail"
                            >
                              <Eye className="h-4 w-4" />
                            </Link>
                            
                            {hasPermission('EDIT_FLEET') && (
                              <>
                                <Link
                                  to={`/flotila/naradli/${tool.id}/edit`}
                                  className="p-1 text-gray-400 hover:text-blue-600"
                                  title="Upravit"
                                >
                                  <Edit className="h-4 w-4" />
                                </Link>
                                
                                <button
                                  onClick={() => handleDeleteTool(tool.id)}
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
            )}

            {/* Maintenance Table */}
            {activeSection === 'udrzba' && (
              <table className="table-auto-responsive">
                <thead>
                  <tr>
                    <th>Datum</th>
                    <th>Vozidlo</th>
                    <th>Typ údržby</th>
                    <th>Popis</th>
                    <th>Náklady</th>
                    <th>Provedl</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((maintenance) => (
                    <tr key={maintenance.id} className="hover:bg-gray-50">
                      <td>{formatDate(maintenance.maintenance_date)}</td>
                      <td>
                        <span className="font-medium">
                          {maintenance.vehicle?.license_plate}
                        </span>
                        <p className="text-sm text-gray-600">
                          {maintenance.vehicle?.brand} {maintenance.vehicle?.model}
                        </p>
                      </td>
                      <td>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {maintenance.type}
                        </span>
                      </td>
                      <td className="text-sm text-gray-600">{maintenance.description}</td>
                      <td className="font-medium">{formatCurrency(maintenance.cost || 0)}</td>
                      <td>
                        {maintenance.performed_by?.first_name} {maintenance.performed_by?.last_name}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default FleetPage
