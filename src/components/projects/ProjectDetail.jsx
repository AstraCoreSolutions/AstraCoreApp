import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useTheme } from '../../context/ThemeContext'
import { supabase, dbOperations, TABLES } from '../../utils/supabase'
import { cn, formatCurrency, formatDate, formatDateTime, calculatePercentage } from '../../utils/helpers'
import {
  ArrowLeft, Edit, Trash2, Plus, Calendar, DollarSign, Users,
  MapPin, Clock, FileText, Camera, Download, Share2, Star,
  AlertTriangle, CheckCircle, Play, Pause, Target, TrendingUp,
  Building2, Phone, Mail, User, Briefcase, Car, Wrench, Eye
} from 'lucide-react'
import LoadingSpinner, { PageLoader } from '../ui/LoadingSpinner'
import toast from 'react-hot-toast'

const ProjectDetail = ({ type = 'project' }) => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { hasPermission, profile } = useAuth()
  const { formatCurrency: themeCurrency } = useTheme()
  
  const [project, setProject] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [diaryEntries, setDiaryEntries] = useState([])
  const [expenses, setExpenses] = useState([])
  const [timeTracking, setTimeTracking] = useState([])
  const [documents, setDocuments] = useState([])

  // Fetch project data
  const fetchProject = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from(TABLES.PROJECTS)
        .select(`
          *,
          client:clients(id, name, email, phone, address),
          manager:user_profiles!project_manager_id(
            id, first_name, last_name, email, phone
          ),
          project_assignments(
            id,
            role,
            employee:employees(
              id, first_name, last_name, position, hourly_rate
            )
          )
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      if (!data) throw new Error('Projekt nenalezen')

      // Check if user has permission to view this project
      if (!hasPermission('VIEW_ALL_PROJECTS')) {
        const hasAccess = data.manager_id === profile.id || 
                         data.project_assignments.some(assignment => 
                           assignment.employee?.id === profile.employee?.id
                         )
        
        if (!hasAccess) {
          throw new Error('Nemáte oprávnění zobrazit tento projekt')
        }
      }

      setProject(data)
    } catch (error) {
      console.error('Error fetching project:', error)
      setError(error.message)
      toast.error('Chyba při načítání projektu')
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch diary entries
  const fetchDiaryEntries = async () => {
    try {
      const { data, error } = await supabase
        .from(TABLES.DIARY_ENTRIES)
        .select(`
          *,
          author:user_profiles(first_name, last_name)
        `)
        .eq('project_id', id)
        .order('entry_date', { ascending: false })
        .limit(10)

      if (error) throw error
      setDiaryEntries(data || [])
    } catch (error) {
      console.error('Error fetching diary entries:', error)
    }
  }

  // Fetch project expenses
  const fetchExpenses = async () => {
    try {
      const { data, error } = await supabase
        .from(TABLES.EXPENSES)
        .select(`
          *,
          category:cost_categories(name, color),
          created_by:user_profiles(first_name, last_name)
        `)
        .eq('project_id', id)
        .order('expense_date', { ascending: false })
        .limit(20)

      if (error) throw error
      setExpenses(data || [])
    } catch (error) {
      console.error('Error fetching expenses:', error)
    }
  }

  // Fetch time tracking
  const fetchTimeTracking = async () => {
    try {
      const { data, error } = await supabase
        .from(TABLES.TIME_TRACKING)
        .select(`
          *,
          employee:employees(first_name, last_name, hourly_rate)
        `)
        .eq('project_id', id)
        .order('work_date', { ascending: false })
        .limit(15)

      if (error) throw error
      setTimeTracking(data || [])
    } catch (error) {
      console.error('Error fetching time tracking:', error)
    }
  }

  // Initial load
  useEffect(() => {
    if (id) {
      fetchProject()
    }
  }, [id])

  // Load additional data when project is loaded
  useEffect(() => {
    if (project && activeTab !== 'overview') {
      switch (activeTab) {
        case 'diary':
          fetchDiaryEntries()
          break
        case 'finances':
          fetchExpenses()
          break
        case 'time':
          fetchTimeTracking()
          break
      }
    }
  }, [project, activeTab])

  // Delete project
  const handleDeleteProject = async () => {
    if (!hasPermission('DELETE_PROJECTS')) {
      toast.error('Nemáte oprávnění mazat projekty')
      return
    }

    if (!confirm(`Opravdu chcete smazat projekt "${project.name}"? Tato akce nelze vrátit zpět.`)) {
      return
    }

    try {
      const { error } = await dbOperations.delete(TABLES.PROJECTS, id)
      if (error) throw error

      toast.success('Projekt byl smazán')
      navigate(project.type === 'zakazka' ? '/zakazky' : '/projekty')
    } catch (error) {
      console.error('Error deleting project:', error)
      toast.error('Chyba při mazání projektu')
    }
  }

  // Update project status
  const updateProjectStatus = async (newStatus) => {
    try {
      const { data, error } = await dbOperations.update(TABLES.PROJECTS, id, {
        status: newStatus
      })
      
      if (error) throw error
      
      setProject(prev => ({ ...prev, status: newStatus }))
      toast.success('Stav projektu byl aktualizován')
    } catch (error) {
      console.error('Error updating project status:', error)
      toast.error('Chyba při aktualizaci stavu projektu')
    }
  }

  // Calculate project stats
  const getProjectStats = () => {
    if (!project) return null

    const totalSpent = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0)
    const totalHours = timeTracking.reduce((sum, entry) => sum + (entry.hours || 0), 0)
    const totalCost = timeTracking.reduce((sum, entry) => 
      sum + ((entry.hours || 0) * (entry.employee?.hourly_rate || 0)), 0
    )
    const remaining = (project.budget || 0) - totalSpent
    const profitMargin = project.budget ? ((project.budget - totalSpent) / project.budget) * 100 : 0

    return {
      totalSpent,
      totalHours,
      totalCost,
      remaining,
      profitMargin
    }
  }

  const stats = getProjectStats()

  // Get status config
  const getStatusConfig = (status) => {
    const configs = {
      nabidka: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Nabídka' },
      schvaleno: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle, label: 'Schváleno' },
      realizace: { color: 'bg-green-100 text-green-800', icon: Play, label: 'Realizace' },
      pozastaveno: { color: 'bg-orange-100 text-orange-800', icon: Pause, label: 'Pozastaveno' },
      dokonceno: { color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle, label: 'Dokončeno' },
      zruseno: { color: 'bg-red-100 text-red-800', icon: AlertTriangle, label: 'Zrušeno' }
    }
    return configs[status] || { color: 'bg-gray-100 text-gray-800', icon: Clock, label: status }
  }

  const tabs = [
    { id: 'overview', label: 'Přehled', icon: Eye },
    { id: 'diary', label: 'Stavební deník', icon: FileText },
    { id: 'finances', label: 'Finance', icon: DollarSign },
    { id: 'time', label: 'Čas', icon: Clock },
    { id: 'documents', label: 'Dokumenty', icon: FileText },
    { id: 'team', label: 'Tým', icon: Users }
  ]

  if (isLoading) {
    return <PageLoader text="Načítání projektu..." />
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Chyba při načítání</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <div className="space-x-4">
          <button onClick={fetchProject} className="btn-primary">
            Zkusit znovu
          </button>
          <button onClick={() => navigate(-1)} className="btn-secondary">
            Zpět
          </button>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Projekt nenalezen</h3>
        <p className="text-gray-600 mb-4">Požadovaný projekt neexistuje nebo k němu nemáte přístup</p>
        <button onClick={() => navigate(-1)} className="btn-secondary">
          Zpět
        </button>
      </div>
    )
  }

  const statusConfig = getStatusConfig(project.status)
  const StatusIcon = statusConfig.icon

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          
          <div className="flex items-center space-x-3">
            <Building2 className="h-8 w-8 text-astra-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                {project.client && (
                  <span>{project.client.name}</span>
                )}
                <span>•</span>
                <span>{project.location}</span>
                <span>•</span>
                <span>ID: #{project.id}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <span className={cn(
            'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium',
            statusConfig.color
          )}>
            <StatusIcon className="h-4 w-4 mr-2" />
            {statusConfig.label}
          </span>

          {hasPermission('EDIT_PROJECTS') && (
            <div className="flex items-center space-x-2">
              <Link
                to={`/${project.type === 'zakazka' ? 'zakazky' : 'projekty'}/${project.id}/edit`}
                className="btn-secondary"
              >
                <Edit className="h-4 w-4 mr-2" />
                Upravit
              </Link>
              
              {hasPermission('DELETE_PROJECTS') && (
                <button
                  onClick={handleDeleteProject}
                  className="btn text-red-600 hover:bg-red-50 border border-red-200 hover:border-red-300"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Smazat
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Project Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Target className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pokrok</p>
              <p className="text-2xl font-bold text-gray-900">{project.progress || 0}%</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${project.progress || 0}%` }}
              />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Rozpočet</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(project.budget || 0)}
              </p>
            </div>
          </div>
          {stats && (
            <div className="mt-2 text-sm text-gray-600">
              Utraceno: {formatCurrency(stats.totalSpent)}
            </div>
          )}
        </div>

        <div className="card p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Calendar className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Deadline</p>
              <p className="text-lg font-bold text-gray-900">
                {formatDate(project.deadline)}
              </p>
            </div>
          </div>
          <div className="mt-2 text-sm text-gray-600">
            Start: {formatDate(project.start_date)}
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Marže</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats ? `${stats.profitMargin.toFixed(1)}%` : 'N/A'}
              </p>
            </div>
          </div>
          {stats && (
            <div className="mt-2 text-sm text-gray-600">
              Zbývá: {formatCurrency(stats.remaining)}
            </div>
          )}
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
            {/* Project Info */}
            <div className="lg:col-span-2 space-y-6">
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Informace o projektu</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900">Popis</h4>
                    <p className="text-gray-600 mt-1">
                      {project.description || 'Žádný popis není k dispozici'}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-900">Typ</h4>
                      <p className="text-gray-600 mt-1">
                        {project.type === 'zakazka' ? 'Zakázka' : 'Vlastní projekt'}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Priorita</h4>
                      <p className={cn(
                        'mt-1 font-medium',
                        project.priority === 'high' && 'text-red-600',
                        project.priority === 'medium' && 'text-yellow-600',
                        project.priority === 'low' && 'text-green-600'
                      )}>
                        {project.priority === 'high' && 'Vysoká'}
                        {project.priority === 'medium' && 'Střední'}
                        {project.priority === 'low' && 'Nízká'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Manager Info */}
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Projektový manažer</h3>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-astra-100 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-astra-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {project.manager?.first_name} {project.manager?.last_name}
                    </p>
                    <p className="text-sm text-gray-600">{project.manager?.email}</p>
                  </div>
                </div>
              </div>

              {/* Client Info */}
              {project.client && (
                <div className="card p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Klient</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="font-medium text-gray-900">{project.client.name}</p>
                      <p className="text-sm text-gray-600">{project.client.email}</p>
                      {project.client.phone && (
                        <p className="text-sm text-gray-600">{project.client.phone}</p>
                      )}
                    </div>
                    {project.client.address && (
                      <div>
                        <p className="text-sm text-gray-600">
                          <MapPin className="h-4 w-4 inline mr-1" />
                          {project.client.address}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Rychlé akce</h3>
                <div className="space-y-3">
                  <Link
                    to={`/zakazky/${project.id}/denik/novy`}
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Plus className="h-4 w-4 text-astra-600" />
                    <span className="text-sm font-medium">Přidat zápis do deníku</span>
                  </Link>
                  
                  <Link
                    to={`/finance/naklady/novy?project=${project.id}`}
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <DollarSign className="h-4 w-4 text-astra-600" />
                    <span className="text-sm font-medium">Přidat náklad</span>
                  </Link>
                  
                  <Link
                    to={`/zamestnanci/cas/novy?project=${project.id}`}
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Clock className="h-4 w-4 text-astra-600" />
                    <span className="text-sm font-medium">Zaznamenat čas</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'diary' && (
          <div className="card p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Stavební deník</h3>
              <Link
                to={`/zakazky/${project.id}/denik/novy`}
                className="btn-primary"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nový zápis
              </Link>
            </div>
            
            {diaryEntries.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">Žádné záznamy</h4>
                <p className="text-gray-600">Začněte přidáním prvního záznamu do stavebního deníku</p>
              </div>
            ) : (
              <div className="space-y-4">
                {diaryEntries.map((entry) => (
                  <div key={entry.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-gray-900">
                        {formatDate(entry.entry_date)}
                      </h4>
                      <span className="text-sm text-gray-500">
                        {entry.author?.first_name} {entry.author?.last_name}
                      </span>
                    </div>
                    {entry.weather && (
                      <p className="text-sm text-gray-600 mb-2">
                        Počasí: {entry.weather}
                      </p>
                    )}
                    <p className="text-gray-700">{entry.work_description}</p>
                    {entry.problems && (
                      <p className="text-red-600 mt-2">
                        Problémy: {entry.problems}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'finances' && (
          <div className="card p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Finance projektu</h3>
              <Link
                to={`/finance/naklady/novy?project=${project.id}`}
                className="btn-primary"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nový náklad
              </Link>
            </div>
            
            {expenses.length === 0 ? (
              <div className="text-center py-8">
                <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">Žádné náklady</h4>
                <p className="text-gray-600">Zatím nebyly zaznamenány žádné náklady</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table-auto-responsive">
                  <thead>
                    <tr>
                      <th>Datum</th>
                      <th>Popis</th>
                      <th>Kategorie</th>
                      <th>Částka</th>
                      <th>Vytvořil</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map((expense) => (
                      <tr key={expense.id}>
                        <td>{formatDate(expense.expense_date)}</td>
                        <td>{expense.description}</td>
                        <td>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {expense.category?.name}
                          </span>
                        </td>
                        <td className="font-medium">{formatCurrency(expense.amount)}</td>
                        <td>
                          {expense.created_by?.first_name} {expense.created_by?.last_name}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'time' && (
          <div className="card p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Sledování času</h3>
              <Link
                to={`/zamestnanci/cas/novy?project=${project.id}`}
                className="btn-primary"
              >
                <Plus className="h-4 w-4 mr-2" />
                Zaznamenat čas
              </Link>
            </div>
            
            {timeTracking.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">Žádné záznamy času</h4>
                <p className="text-gray-600">Zatím nebyl zaznamenán žádný odpracovaný čas</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table-auto-responsive">
                  <thead>
                    <tr>
                      <th>Datum</th>
                      <th>Zaměstnanec</th>
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
                          {entry.employee?.first_name} {entry.employee?.last_name}
                        </td>
                        <td className="font-medium">{entry.hours}h</td>
                        <td>{entry.description}</td>
                        <td className="font-medium">
                          {formatCurrency((entry.hours || 0) * (entry.employee?.hourly_rate || 0))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'team' && (
          <div className="card p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Projektový tým</h3>
              {hasPermission('EDIT_PROJECTS') && (
                <Link
                  to={`/zakazky/${project.id}/tym`}
                  className="btn-primary"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Spravovat tým
                </Link>
              )}
            </div>
            
            {project.project_assignments?.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">Žádní přiřazení zaměstnanci</h4>
                <p className="text-gray-600">K projektu zatím nejsou přiřazeni žádní zaměstnanci</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {project.project_assignments.map((assignment) => (
                  <div key={assignment.id} className="border rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-astra-100 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-astra-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {assignment.employee?.first_name} {assignment.employee?.last_name}
                        </p>
                        <p className="text-sm text-gray-600">{assignment.employee?.position}</p>
                        <p className="text-sm text-gray-500">Role: {assignment.role}</p>
                      </div>
                    </div>
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

export default ProjectDetail
