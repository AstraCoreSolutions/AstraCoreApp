import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useTheme } from '../../context/ThemeContext'
import { supabase, dbOperations, TABLES } from '../../utils/supabase'
import { cn, formatCurrency, formatDate, calculatePercentage } from '../../utils/helpers'
import {
  Plus, Search, Filter, Eye, Edit, Trash2, MoreVertical,
  Calendar, DollarSign, User, MapPin, Clock, TrendingUp,
  TrendingDown, AlertTriangle, CheckCircle, Pause, Play,
  Building2, Briefcase, Home, Download, RefreshCw
} from 'lucide-react'
import LoadingSpinner, { TableSkeleton } from '../ui/LoadingSpinner'
import toast from 'react-hot-toast'

const ProjectsPage = ({ type = 'zakazka' }) => {
  const { hasPermission, profile } = useAuth()
  const { formatCurrency: themeCurrency } = useTheme()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  
  const [projects, setProjects] = useState([])
  const [filteredProjects, setFilteredProjects] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all')
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'deadline')
  const [sortOrder, setSortOrder] = useState(searchParams.get('order') || 'asc')
  const [showFilters, setShowFilters] = useState(false)

  // Page configuration based on type
  const pageConfig = {
    zakazka: {
      title: 'Zakázky',
      subtitle: 'Správa zakázek pro klienty',
      icon: Briefcase,
      addButtonText: 'Nová zakázka',
      addLink: '/zakazky/nova'
    },
    projekt: {
      title: 'Vlastní projekty',
      subtitle: 'Developmentské projekty společnosti',
      icon: Building2,
      addButtonText: 'Nový projekt',
      addLink: '/projekty/novy'
    }
  }

  const config = pageConfig[type]

  // Status options
  const statusOptions = [
    { value: 'all', label: 'Všechny stavy' },
    { value: 'nabidka', label: 'Nabídka' },
    { value: 'schvaleno', label: 'Schváleno' },
    { value: 'realizace', label: 'Realizace' },
    { value: 'pozastaveno', label: 'Pozastaveno' },
    { value: 'dokonceno', label: 'Dokončeno' },
    { value: 'zruseno', label: 'Zrušeno' }
  ]

  // Fetch projects from Supabase
  const fetchProjects = async (showLoading = true) => {
    try {
      if (showLoading) setIsLoading(true)
      setError(null)

      // Build query based on user permissions and type
      let query = supabase
        .from(TABLES.PROJECTS)
        .select(`
          *,
          client:clients(id, name, email),
          manager:user_profiles!project_manager_id(id, first_name, last_name),
          project_assignments(
            employee:employees(id, first_name, last_name)
          )
        `)
        .eq('type', type)

      // Apply user-based filters if not admin
      if (!hasPermission('VIEW_ALL_PROJECTS')) {
        query = query.or(`manager_id.eq.${profile.id},project_assignments.employee_id.eq.${profile.employee?.id}`)
      }

      // Apply sorting
      if (sortBy === 'deadline') {
        query = query.order('deadline', { ascending: sortOrder === 'asc' })
      } else if (sortBy === 'name') {
        query = query.order('name', { ascending: sortOrder === 'asc' })
      } else if (sortBy === 'budget') {
        query = query.order('budget', { ascending: sortOrder === 'asc' })
      } else if (sortBy === 'progress') {
        query = query.order('progress', { ascending: sortOrder === 'asc' })
      } else {
        query = query.order('updated_at', { ascending: false })
      }

      const { data, error } = await query

      if (error) throw error

      setProjects(data || [])
    } catch (error) {
      console.error('Error fetching projects:', error)
      setError(error.message)
      toast.error('Chyba při načítání projektů')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  // Initial load
  useEffect(() => {
    fetchProjects()
  }, [type, sortBy, sortOrder])

  // Refresh data
  const handleRefresh = () => {
    setIsRefreshing(true)
    fetchProjects(false)
  }

  // Filter projects
  useEffect(() => {
    let filtered = [...projects]

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter(project =>
        project.name.toLowerCase().includes(query) ||
        project.client?.name?.toLowerCase().includes(query) ||
        project.location?.toLowerCase().includes(query) ||
        project.description?.toLowerCase().includes(query)
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(project => project.status === statusFilter)
    }

    setFilteredProjects(filtered)
  }, [projects, searchQuery, statusFilter])

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams()
    if (searchQuery) params.set('search', searchQuery)
    if (statusFilter !== 'all') params.set('status', statusFilter)
    if (sortBy !== 'deadline') params.set('sort', sortBy)
    if (sortOrder !== 'asc') params.set('order', sortOrder)
    
    setSearchParams(params, { replace: true })
  }, [searchQuery, statusFilter, sortBy, sortOrder])

  // Delete project
  const handleDeleteProject = async (projectId) => {
    if (!hasPermission('DELETE_PROJECTS')) {
      toast.error('Nemáte oprávnění mazat projekty')
      return
    }

    if (!confirm('Opravdu chcete smazat tento projekt? Tato akce nelze vrátit zpět.')) {
      return
    }

    try {
      const { error } = await dbOperations.delete(TABLES.PROJECTS, projectId)
      if (error) throw error

      setProjects(prev => prev.filter(p => p.id !== projectId))
      toast.success('Projekt byl smazán')
    } catch (error) {
      console.error('Error deleting project:', error)
      toast.error('Chyba při mazání projektu')
    }
  }

  // Get status color and icon
  const getStatusConfig = (status) => {
    const configs = {
      nabidka: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      schvaleno: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
      realizace: { color: 'bg-green-100 text-green-800', icon: Play },
      pozastaveno: { color: 'bg-orange-100 text-orange-800', icon: Pause },
      dokonceno: { color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle },
      zruseno: { color: 'bg-red-100 text-red-800', icon: AlertTriangle }
    }
    return configs[status] || { color: 'bg-gray-100 text-gray-800', icon: Clock }
  }

  // Get priority color
  const getPriorityColor = (priority) => {
    const colors = {
      high: 'text-red-600',
      medium: 'text-yellow-600',
      low: 'text-green-600'
    }
    return colors[priority] || 'text-gray-600'
  }

  // Calculate project metrics
  const getProjectMetrics = () => {
    if (filteredProjects.length === 0) return null

    const total = filteredProjects.length
    const active = filteredProjects.filter(p => p.status === 'realizace').length
    const totalBudget = filteredProjects.reduce((sum, p) => sum + (p.budget || 0), 0)
    const totalSpent = filteredProjects.reduce((sum, p) => sum + (p.spent || 0), 0)
    const avgProgress = filteredProjects.reduce((sum, p) => sum + (p.progress || 0), 0) / total

    return { total, active, totalBudget, totalSpent, avgProgress }
  }

  const metrics = getProjectMetrics()

  if (isLoading && projects.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{config.title}</h1>
            <p className="text-gray-600">{config.subtitle}</p>
          </div>
        </div>
        <TableSkeleton rows={10} columns={6} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Chyba při načítání</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={() => fetchProjects()}
          className="btn-primary"
        >
          Zkusit znovu
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-3">
          <config.icon className="h-8 w-8 text-astra-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{config.title}</h1>
            <p className="text-gray-600">{config.subtitle}</p>
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
          
          {hasPermission('EDIT_PROJECTS') && (
            <Link to={config.addLink} className="btn-primary">
              <Plus className="h-4 w-4 mr-2" />
              {config.addButtonText}
            </Link>
          )}
        </div>
      </div>

      {/* Metrics Cards */}
      {metrics && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Briefcase className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Celkem projektů</p>
                <p className="text-xl font-bold text-gray-900">{metrics.total}</p>
              </div>
            </div>
          </div>
          
          <div className="card p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Play className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Aktivní</p>
                <p className="text-xl font-bold text-gray-900">{metrics.active}</p>
              </div>
            </div>
          </div>
          
          <div className="card p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Celkový rozpočet</p>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(metrics.totalBudget)}</p>
              </div>
            </div>
          </div>
          
          <div className="card p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Průměrný pokrok</p>
                <p className="text-xl font-bold text-gray-900">{Math.round(metrics.avgProgress)}%</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Hledat projekty..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input pl-10"
              />
            </div>
          </div>
          
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input w-auto"
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          
          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="input w-auto"
          >
            <option value="deadline">Podle deadline</option>
            <option value="name">Podle názvu</option>
            <option value="budget">Podle rozpočtu</option>
            <option value="progress">Podle pokroku</option>
          </select>
          
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="btn-secondary"
          >
            {sortOrder === 'asc' ? 'Vzestupně' : 'Sestupně'}
          </button>
        </div>
      </div>

      {/* Projects List */}
      <div className="card overflow-hidden">
        {filteredProjects.length === 0 ? (
          <div className="text-center py-12">
            <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery || statusFilter !== 'all' ? 'Žádné projekty nevyhovují filtrům' : 'Žádné projekty'}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchQuery || statusFilter !== 'all' ? 'Zkuste upravit filtry' : 'Začněte vytvořením nového projektu'}
            </p>
            {hasPermission('EDIT_PROJECTS') && (
              <Link to={config.addLink} className="btn-primary">
                <Plus className="h-4 w-4 mr-2" />
                {config.addButtonText}
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-auto-responsive">
              <thead>
                <tr>
                  <th>Projekt</th>
                  {type === 'zakazka' && <th>Klient</th>}
                  <th>Stav</th>
                  <th>Pokrok</th>
                  <th>Rozpočet</th>
                  <th>Deadline</th>
                  <th>Akce</th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.map((project) => {
                  const statusConfig = getStatusConfig(project.status)
                  const StatusIcon = statusConfig.icon
                  const isOverdue = new Date(project.deadline) < new Date() && project.status !== 'dokonceno'
                  
                  return (
                    <tr key={project.id} className="hover:bg-gray-50">
                      <td>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="font-medium text-gray-900">{project.name}</h3>
                            {project.priority === 'high' && (
                              <AlertTriangle className="h-4 w-4 text-red-500" />
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{project.location}</p>
                          <p className="text-sm text-gray-500">Vedoucí: {project.manager?.first_name} {project.manager?.last_name}</p>
                        </div>
                      </td>
                      
                      {type === 'zakazka' && (
                        <td>
                          <p className="font-medium text-gray-900">{project.client?.name}</p>
                          <p className="text-sm text-gray-600">{project.client?.email}</p>
                        </td>
                      )}
                      
                      <td>
                        <span className={cn('inline-flex items-center px-2 py-1 rounded-full text-xs font-medium', statusConfig.color)}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {project.status}
                        </span>
                      </td>
                      
                      <td>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>{project.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-astra-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${project.progress}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      
                      <td>
                        <div className="text-sm">
                          <p className="font-medium">{formatCurrency(project.budget)}</p>
                          <p className="text-gray-600">Utraceno: {formatCurrency(project.spent || 0)}</p>
                        </div>
                      </td>
                      
                      <td>
                        <div className={cn('text-sm', isOverdue && 'text-red-600')}>
                          <p className="font-medium">{formatDate(project.deadline)}</p>
                          {isOverdue && (
                            <p className="text-red-500 text-xs">Překročeno</p>
                          )}
                        </div>
                      </td>
                      
                      <td>
                        <div className="flex items-center space-x-2">
                          <Link
                            to={`/${type === 'zakazka' ? 'zakazky' : 'projekty'}/${project.id}`}
                            className="p-1 text-gray-400 hover:text-astra-600"
                            title="Zobrazit detail"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          
                          {hasPermission('EDIT_PROJECTS') && (
                            <Link
                              to={`/${type === 'zakazka' ? 'zakazky' : 'projekty'}/${project.id}/edit`}
                              className="p-1 text-gray-400 hover:text-blue-600"
                              title="Upravit"
                            >
                              <Edit className="h-4 w-4" />
                            </Link>
                          )}
                          
                          {hasPermission('DELETE_PROJECTS') && (
                            <button
                              onClick={() => handleDeleteProject(project.id)}
                              className="p-1 text-gray-400 hover:text-red-600"
                              title="Smazat"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
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

export default ProjectsPage
