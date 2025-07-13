import React, { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useTheme } from '../../context/ThemeContext'
import { supabase, dbOperations, TABLES } from '../../utils/supabase'
import { cn, formatCurrency, formatDate, formatPhone } from '../../utils/helpers'
import {
  Users, Plus, Search, Filter, Eye, Edit, Trash2, Phone, Mail,
  MapPin, Calendar, Clock, DollarSign, Star, Award, AlertTriangle,
  CheckCircle, User, Briefcase, GraduationCap, Shield, RefreshCw,
  FileText, Camera, Download, UserPlus, UserCheck, UserX
} from 'lucide-react'
import LoadingSpinner, { TableSkeleton } from '../ui/LoadingSpinner'
import toast from 'react-hot-toast'

const EmployeesPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { hasPermission, profile } = useAuth()
  const { formatCurrency: themeCurrency } = useTheme()
  
  const [employees, setEmployees] = useState([])
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [positionFilter, setPositionFilter] = useState('all')
  const [timeTracking, setTimeTracking] = useState([])
  const [employeeStats, setEmployeeStats] = useState(null)

  // Permission check
  useEffect(() => {
    if (!hasPermission('VIEW_EMPLOYEES')) {
      toast.error('Nemáte oprávnění k zobrazení zaměstnanců')
      navigate('/dashboard')
      return
    }
  }, [hasPermission, navigate])

  // Fetch employees
  const fetchEmployees = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from(TABLES.EMPLOYEES)
        .select(`
          *,
          user_profile:user_profiles(id, email, phone),
          project_assignments(
            id,
            role,
            project:projects(id, name, status)
          ),
          time_tracking(
            id,
            hours,
            work_date,
            project:projects(name)
          )
        `)
        .order('first_name', { ascending: true })

      if (error) throw error

      // Calculate additional stats for each employee
      const employeesWithStats = data.map(employee => {
        const currentMonth = new Date().getMonth()
        const currentYear = new Date().getFullYear()
        
        const monthlyHours = employee.time_tracking?.filter(track => {
          const date = new Date(track.work_date)
          return date.getMonth() === currentMonth && date.getFullYear() === currentYear
        }).reduce((sum, track) => sum + (track.hours || 0), 0) || 0

        const activeProjects = employee.project_assignments?.filter(assignment => 
          assignment.project?.status === 'realizace'
        ).length || 0

        return {
          ...employee,
          monthlyHours,
          activeProjects,
          monthlySalary: monthlyHours * (employee.hourly_rate || 0)
        }
      })

      setEmployees(employeesWithStats)

      // If viewing specific employee, load their details
      if (id) {
        const employee = employeesWithStats.find(emp => emp.id === parseInt(id))
        if (employee) {
          setSelectedEmployee(employee)
          await fetchEmployeeTimeTracking(id)
        } else {
          toast.error('Zaměstnanec nenalezen')
          navigate('/zamestnanci')
        }
      }

    } catch (error) {
      console.error('Error fetching employees:', error)
      setError(error.message)
      toast.error('Chyba při načítání zaměstnanců')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  // Fetch employee time tracking
  const fetchEmployeeTimeTracking = async (employeeId) => {
    try {
      const { data, error } = await supabase
        .from(TABLES.TIME_TRACKING)
        .select(`
          *,
          project:projects(name, type)
        `)
        .eq('employee_id', employeeId)
        .order('work_date', { ascending: false })
        .limit(30)

      if (error) throw error
      setTimeTracking(data || [])
    } catch (error) {
      console.error('Error fetching time tracking:', error)
    }
  }

  // Initial load
  useEffect(() => {
    fetchEmployees()
  }, [id])

  // Refresh data
  const handleRefresh = () => {
    setIsRefreshing(true)
    fetchEmployees()
  }

  // Filter employees
  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = !searchQuery || 
      `${employee.first_name} ${employee.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.position?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.user_profile?.email?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === 'all' || employee.status === statusFilter
    const matchesPosition = positionFilter === 'all' || employee.position === positionFilter

    return matchesSearch && matchesStatus && matchesPosition
  })

  // Update employee status
  const updateEmployeeStatus = async (employeeId, newStatus) => {
    if (!hasPermission('EDIT_EMPLOYEES')) {
      toast.error('Nemáte oprávnění upravovat zaměstnance')
      return
    }

    try {
      const { data, error } = await dbOperations.update(TABLES.EMPLOYEES, employeeId, {
        status: newStatus
      })
      
      if (error) throw error
      
      setEmployees(prev => prev.map(emp => 
        emp.id === employeeId ? { ...emp, status: newStatus } : emp
      ))
      
      if (selectedEmployee?.id === employeeId) {
        setSelectedEmployee(prev => ({ ...prev, status: newStatus }))
      }
      
      toast.success('Stav zaměstnance byl aktualizován')
    } catch (error) {
      console.error('Error updating employee status:', error)
      toast.error('Chyba při aktualizaci stavu zaměstnance')
    }
  }

  // Delete employee
  const handleDeleteEmployee = async (employeeId) => {
    if (!hasPermission('EDIT_EMPLOYEES')) {
      toast.error('Nemáte oprávnění mazat zaměstnance')
      return
    }

    const employee = employees.find(emp => emp.id === employeeId)
    if (!confirm(`Opravdu chcete smazat zaměstnance ${employee?.first_name} ${employee?.last_name}?`)) {
      return
    }

    try {
      const { error } = await dbOperations.delete(TABLES.EMPLOYEES, employeeId)
      if (error) throw error

      setEmployees(prev => prev.filter(emp => emp.id !== employeeId))
      
      if (selectedEmployee?.id === employeeId) {
        setSelectedEmployee(null)
        navigate('/zamestnanci')
      }
      
      toast.success('Zaměstnanec byl smazán')
    } catch (error) {
      console.error('Error deleting employee:', error)
      toast.error('Chyba při mazání zaměstnance')
    }
  }

  // Get status config
  const getStatusConfig = (status) => {
    const configs = {
      active: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Aktivní' },
      inactive: { color: 'bg-gray-100 text-gray-800', icon: UserX, label: 'Neaktivní' },
      vacation: { color: 'bg-blue-100 text-blue-800', icon: Calendar, label: 'Dovolená' },
      sick: { color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle, label: 'Nemocenská' },
      terminated: { color: 'bg-red-100 text-red-800', icon: UserX, label: 'Ukončen' }
    }
    return configs[status] || configs.active
  }

  // Calculate team statistics
  const teamStats = {
    total: filteredEmployees.length,
    active: filteredEmployees.filter(emp => emp.status === 'active').length,
    totalHours: filteredEmployees.reduce((sum, emp) => sum + emp.monthlyHours, 0),
    totalSalary: filteredEmployees.reduce((sum, emp) => sum + emp.monthlySalary, 0),
    avgHourlyRate: filteredEmployees.length > 0 
      ? filteredEmployees.reduce((sum, emp) => sum + (emp.hourly_rate || 0), 0) / filteredEmployees.length 
      : 0
  }

  const tabs = [
    { id: 'overview', label: 'Přehled', icon: Eye },
    { id: 'time', label: 'Docházka', icon: Clock },
    { id: 'projects', label: 'Projekty', icon: Briefcase },
    { id: 'documents', label: 'Dokumenty', icon: FileText },
    { id: 'performance', label: 'Výkonnost', icon: Award }
  ]

  if (isLoading && employees.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Zaměstnanci</h1>
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

  // Show employee detail view
  if (selectedEmployee) {
    const statusConfig = getStatusConfig(selectedEmployee.status)
    const StatusIcon = statusConfig.icon

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => {
                setSelectedEmployee(null)
                navigate('/zamestnanci')
              }}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <Users className="h-5 w-5" />
            </button>
            
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-astra-100 rounded-full flex items-center justify-center">
                <User className="h-6 w-6 text-astra-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {selectedEmployee.first_name} {selectedEmployee.last_name}
                </h1>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>{selectedEmployee.position}</span>
                  <span>•</span>
                  <span>ID: #{selectedEmployee.id}</span>
                  <span>•</span>
                  <span className={cn('inline-flex items-center px-2 py-1 rounded-full text-xs font-medium', statusConfig.color)}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {statusConfig.label}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {hasPermission('EDIT_EMPLOYEES') && (
              <div className="flex items-center space-x-2">
                <Link
                  to={`/zamestnanci/${selectedEmployee.id}/edit`}
                  className="btn-secondary"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Upravit
                </Link>
                
                <button
                  onClick={() => handleDeleteEmployee(selectedEmployee.id)}
                  className="btn text-red-600 hover:bg-red-50 border border-red-200 hover:border-red-300"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Smazat
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Employee Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Hodiny tento měsíc</p>
                <p className="text-2xl font-bold text-gray-900">{selectedEmployee.monthlyHours}h</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Hodinová sazba</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(selectedEmployee.hourly_rate || 0)}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Briefcase className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Aktivní projekty</p>
                <p className="text-2xl font-bold text-gray-900">{selectedEmployee.activeProjects}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Nastoupen</p>
                <p className="text-lg font-bold text-gray-900">
                  {formatDate(selectedEmployee.hire_date)}
                </p>
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

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="card p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Základní informace</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-900">Jméno a příjmení</h4>
                      <p className="text-gray-600">{selectedEmployee.first_name} {selectedEmployee.last_name}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Pozice</h4>
                      <p className="text-gray-600">{selectedEmployee.position}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Email</h4>
                      <p className="text-gray-600">{selectedEmployee.user_profile?.email}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Telefon</h4>
                      <p className="text-gray-600">{formatPhone(selectedEmployee.user_profile?.phone)}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Datum nástupu</h4>
                      <p className="text-gray-600">{formatDate(selectedEmployee.hire_date)}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Hodinová sazba</h4>
                      <p className="text-gray-600">{formatCurrency(selectedEmployee.hourly_rate || 0)}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="card p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Kontakt</h3>
                  <div className="space-y-3">
                    {selectedEmployee.user_profile?.email && (
                      <div className="flex items-center space-x-3">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{selectedEmployee.user_profile.email}</span>
                      </div>
                    )}
                    {selectedEmployee.user_profile?.phone && (
                      <div className="flex items-center space-x-3">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{formatPhone(selectedEmployee.user_profile.phone)}</span>
                      </div>
                    )}
                    {selectedEmployee.address && (
                      <div className="flex items-center space-x-3">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{selectedEmployee.address}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="card p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Rychlé akce</h3>
                  <div className="space-y-3">
                    <Link
                      to={`/zamestnanci/cas/novy?employee=${selectedEmployee.id}`}
                      className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Clock className="h-4 w-4 text-astra-600" />
                      <span className="text-sm font-medium">Zaznamenat čas</span>
                    </Link>
                    
                    <Link
                      to={`/zamestnanci/${selectedEmployee.id}/dovolena`}
                      className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Calendar className="h-4 w-4 text-astra-600" />
                      <span className="text-sm font-medium">Požádat o dovolenou</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'time' && (
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Docházka a odpracovaný čas</h3>
              
              {timeTracking.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Žádné záznamy</h4>
                  <p className="text-gray-600">Zatím nebyl zaznamenán žádný odpracovaný čas</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="table-auto-responsive">
                    <thead>
                      <tr>
                        <th>Datum</th>
                        <th>Projekt</th>
                        <th>Hodiny</th>
                        <th>Popis práce</th>
                        <th>Náklady</th>
                      </tr>
                    </thead>
                    <tbody>
                      {timeTracking.map((entry) => (
                        <tr key={entry.id}>
                          <td>{formatDate(entry.work_date)}</td>
                          <td>
                            {entry.project ? (
                              <span className="text-sm font-medium">{entry.project.name}</span>
                            ) : (
                              <span className="text-sm text-gray-500">Obecná práce</span>
                            )}
                          </td>
                          <td className="font-medium">{entry.hours}h</td>
                          <td className="text-sm text-gray-600">{entry.description}</td>
                          <td className="font-medium">
                            {formatCurrency((entry.hours || 0) * (selectedEmployee.hourly_rate || 0))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'projects' && (
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Přiřazené projekty</h3>
              
              {selectedEmployee.project_assignments?.length === 0 ? (
                <div className="text-center py-8">
                  <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Žádné projekty</h4>
                  <p className="text-gray-600">Zaměstnanec zatím není přiřazen k žádnému projektu</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedEmployee.project_assignments.map((assignment) => (
                    <div key={assignment.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{assignment.project?.name}</h4>
                        <span className={cn(
                          'px-2 py-1 rounded-full text-xs font-medium',
                          assignment.project?.status === 'realizace' 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        )}>
                          {assignment.project?.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">Role: {assignment.role}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Show employees list view
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
        <div className="flex items-center space-x-3">
          <Users className="h-8 w-8 text-astra-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Zaměstnanci</h1>
            <p className="text-gray-600">Správa týmu a lidských zdrojů</p>
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
          
          {hasPermission('EDIT_EMPLOYEES') && (
            <Link to="/zamestnanci/novy" className="btn-primary">
              <Plus className="h-4 w-4 mr-2" />
              Nový zaměstnanec
            </Link>
          )}
        </div>
      </div>

      {/* Team Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="card p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Celkem</p>
              <p className="text-xl font-bold text-gray-900">{teamStats.total}</p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <UserCheck className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Aktivní</p>
              <p className="text-xl font-bold text-gray-900">{teamStats.active}</p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Hodiny/měsíc</p>
              <p className="text-xl font-bold text-gray-900">{teamStats.totalHours}h</p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Mzdy/měsíc</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(teamStats.totalSalary)}</p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Star className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Průměr/hod</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(teamStats.avgHourlyRate)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Hledat zaměstnance..."
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
            <option value="active">Aktivní</option>
            <option value="inactive">Neaktivní</option>
            <option value="vacation">Dovolená</option>
            <option value="sick">Nemocenská</option>
          </select>
          
          <select
            value={positionFilter}
            onChange={(e) => setPositionFilter(e.target.value)}
            className="input w-auto"
          >
            <option value="all">Všechny pozice</option>
            <option value="manager">Manažer</option>
            <option value="site_manager">Stavbyvedoucí</option>
            <option value="worker">Dělník</option>
            <option value="assistant">Asistent</option>
          </select>
        </div>
      </div>

      {/* Employees List */}
      <div className="card overflow-hidden">
        {filteredEmployees.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery || statusFilter !== 'all' || positionFilter !== 'all' 
                ? 'Žádní zaměstnanci nevyhovují filtrům' 
                : 'Žádní zaměstnanci'
              }
            </h3>
            <p className="text-gray-600 mb-4">
              {searchQuery || statusFilter !== 'all' || positionFilter !== 'all'
                ? 'Zkuste upravit filtry'
                : 'Začněte přidáním prvního zaměstnance'
              }
            </p>
            {hasPermission('EDIT_EMPLOYEES') && (
              <Link to="/zamestnanci/novy" className="btn-primary">
                <Plus className="h-4 w-4 mr-2" />
                Nový zaměstnanec
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-auto-responsive">
              <thead>
                <tr>
                  <th>Zaměstnanec</th>
                  <th>Pozice</th>
                  <th>Stav</th>
                  <th>Hodiny/měsíc</th>
                  <th>Hodinová sazba</th>
                  <th>Projekty</th>
                  <th>Akce</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((employee) => {
                  const statusConfig = getStatusConfig(employee.status)
                  const StatusIcon = statusConfig.icon
                  
                  return (
                    <tr key={employee.id} className="hover:bg-gray-50">
                      <td>
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-astra-100 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-astra-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {employee.first_name} {employee.last_name}
                            </p>
                            <p className="text-sm text-gray-600">{employee.user_profile?.email}</p>
                          </div>
                        </div>
                      </td>
                      
                      <td>
                        <span className="text-sm text-gray-900">{employee.position}</span>
                      </td>
                      
                      <td>
                        <span className={cn('inline-flex items-center px-2 py-1 rounded-full text-xs font-medium', statusConfig.color)}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusConfig.label}
                        </span>
                      </td>
                      
                      <td>
                        <span className="font-medium">{employee.monthlyHours}h</span>
                      </td>
                      
                      <td>
                        <span className="font-medium">{formatCurrency(employee.hourly_rate || 0)}</span>
                      </td>
                      
                      <td>
                        <span className="text-sm text-gray-900">{employee.activeProjects}</span>
                      </td>
                      
                      <td>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setSelectedEmployee(employee)
                              navigate(`/zamestnanci/${employee.id}`)
                            }}
                            className="p-1 text-gray-400 hover:text-astra-600"
                            title="Zobrazit detail"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          
                          {hasPermission('EDIT_EMPLOYEES') && (
                            <>
                              <Link
                                to={`/zamestnanci/${employee.id}/edit`}
                                className="p-1 text-gray-400 hover:text-blue-600"
                                title="Upravit"
                              >
                                <Edit className="h-4 w-4" />
                              </Link>
                              
                              <button
                                onClick={() => handleDeleteEmployee(employee.id)}
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
      </div>
    </div>
  )
}

export default EmployeesPage
