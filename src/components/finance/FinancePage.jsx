import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useTheme } from '../../context/ThemeContext'
import { supabase, dbOperations, TABLES } from '../../utils/supabase'
import { cn, formatCurrency, formatDate, calculatePercentage, calculateVAT } from '../../utils/helpers'
import {
  Calculator, TrendingUp, TrendingDown, DollarSign, Euro,
  PieChart, BarChart3, Receipt, CreditCard, Target, AlertTriangle,
  Plus, Eye, Edit, Download, Filter, Search, RefreshCw,
  ArrowUp, ArrowDown, Calendar, Building2, Users, Car
} from 'lucide-react'
import LoadingSpinner, { ChartSkeleton, TableSkeleton } from '../ui/LoadingSpinner'
import toast from 'react-hot-toast'

const FinancePage = () => {
  const { section } = useParams()
  const navigate = useNavigate()
  const { hasPermission } = useAuth()
  const { formatCurrency: themeCurrency } = useTheme()
  
  const [activeSection, setActiveSection] = useState(section || 'dashboard')
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState(null)
  
  // Data states
  const [dashboardData, setDashboardData] = useState(null)
  const [expenses, setExpenses] = useState([])
  const [budgets, setBudgets] = useState([])
  const [analytics, setAnalytics] = useState(null)
  
  // Filter states
  const [dateRange, setDateRange] = useState('current_month')
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [projectFilter, setProjectFilter] = useState('all')

  // Permission check
  useEffect(() => {
    if (!hasPermission('VIEW_FINANCES')) {
      toast.error('Nemáte oprávnění k zobrazení finančních dat')
      navigate('/dashboard')
      return
    }
  }, [hasPermission, navigate])

  // Section navigation
  const sections = [
    { id: 'dashboard', label: 'Přehled', icon: BarChart3 },
    { id: 'naklady', label: 'Náklady', icon: Receipt },
    { id: 'analyzy', label: 'Analýzy', icon: PieChart },
    { id: 'rozpocty', label: 'Rozpočty', icon: Target },
    { id: 'dph', label: 'DPH', icon: Calculator },
    { id: 'reporty', label: 'Reporty', icon: Download }
  ]

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      const endDate = new Date()
      const startDate = new Date()
      
      // Set date range based on filter
      if (dateRange === 'current_month') {
        startDate.setDate(1)
      } else if (dateRange === 'last_month') {
        startDate.setMonth(startDate.getMonth() - 1, 1)
        endDate.setMonth(endDate.getMonth() - 1 + 1, 0)
      } else if (dateRange === 'current_year') {
        startDate.setMonth(0, 1)
      } else if (dateRange === 'last_year') {
        startDate.setFullYear(startDate.getFullYear() - 1, 0, 1)
        endDate.setFullYear(endDate.getFullYear() - 1, 11, 31)
      }

      // Fetch expenses for the period
      const { data: expensesData, error: expensesError } = await supabase
        .from(TABLES.EXPENSES)
        .select(`
          *,
          category:cost_categories(name, color),
          project:projects(name, type),
          created_by:user_profiles(first_name, last_name)
        `)
        .gte('expense_date', startDate.toISOString().split('T')[0])
        .lte('expense_date', endDate.toISOString().split('T')[0])
        .order('expense_date', { ascending: false })

      if (expensesError) throw expensesError

      // Fetch projects for revenue calculation
      const { data: projectsData, error: projectsError } = await supabase
        .from(TABLES.PROJECTS)
        .select('budget, spent, status, type')

      if (projectsError) throw projectsError

      // Calculate metrics
      const totalExpenses = expensesData.reduce((sum, exp) => sum + (exp.amount || 0), 0)
      const totalRevenue = projectsData
        .filter(p => p.status === 'dokonceno')
        .reduce((sum, p) => sum + (p.budget || 0), 0)
      const totalBudget = projectsData.reduce((sum, p) => sum + (p.budget || 0), 0)
      const totalSpent = projectsData.reduce((sum, p) => sum + (p.spent || 0), 0)

      // Calculate VAT
      const vatExpenses = expensesData.filter(exp => exp.vat_rate > 0)
      const totalVATInput = vatExpenses.reduce((sum, exp) => {
        const vat = calculateVAT(exp.amount_without_vat || exp.amount, exp.vat_rate || 21)
        return sum + vat.vat
      }, 0)

      // Group expenses by category
      const expensesByCategory = expensesData.reduce((acc, exp) => {
        const categoryName = exp.category?.name || 'Ostatní'
        acc[categoryName] = (acc[categoryName] || 0) + exp.amount
        return acc
      }, {})

      // Monthly trend (last 6 months)
      const monthlyTrend = []
      for (let i = 5; i >= 0; i--) {
        const date = new Date()
        date.setMonth(date.getMonth() - i)
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0)
        
        const monthExpenses = expensesData.filter(exp => {
          const expDate = new Date(exp.expense_date)
          return expDate >= monthStart && expDate <= monthEnd
        })
        
        const monthTotal = monthExpenses.reduce((sum, exp) => sum + exp.amount, 0)
        
        monthlyTrend.push({
          month: date.toLocaleDateString('cs-CZ', { month: 'short' }),
          expenses: monthTotal,
          // In real app, you'd fetch revenue data here too
          revenue: monthTotal * 1.3 // Mock revenue
        })
      }

      setDashboardData({
        metrics: {
          totalExpenses,
          totalRevenue,
          profit: totalRevenue - totalExpenses,
          totalBudget,
          totalSpent,
          totalVATInput,
          profitMargin: totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue) * 100 : 0
        },
        expensesByCategory,
        monthlyTrend,
        recentExpenses: expensesData.slice(0, 5)
      })

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      setError(error.message)
      toast.error('Chyba při načítání finančních dat')
    }
  }

  // Fetch expenses
  const fetchExpenses = async () => {
    try {
      let query = supabase
        .from(TABLES.EXPENSES)
        .select(`
          *,
          category:cost_categories(name, color),
          project:projects(name, type),
          created_by:user_profiles(first_name, last_name)
        `)
        .order('expense_date', { ascending: false })

      // Apply filters
      if (projectFilter !== 'all') {
        query = query.eq('project_id', projectFilter)
      }

      if (categoryFilter !== 'all') {
        query = query.eq('category_id', categoryFilter)
      }

      // Apply date range
      const endDate = new Date()
      const startDate = new Date()
      
      if (dateRange === 'current_month') {
        startDate.setDate(1)
        query = query.gte('expense_date', startDate.toISOString().split('T')[0])
      } else if (dateRange === 'last_month') {
        startDate.setMonth(startDate.getMonth() - 1, 1)
        endDate.setMonth(endDate.getMonth() - 1 + 1, 0)
        query = query
          .gte('expense_date', startDate.toISOString().split('T')[0])
          .lte('expense_date', endDate.toISOString().split('T')[0])
      }

      const { data, error } = await query.limit(100)

      if (error) throw error

      // Apply search filter
      let filteredData = data || []
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        filteredData = filteredData.filter(exp =>
          exp.description?.toLowerCase().includes(query) ||
          exp.category?.name?.toLowerCase().includes(query) ||
          exp.project?.name?.toLowerCase().includes(query)
        )
      }

      setExpenses(filteredData)
    } catch (error) {
      console.error('Error fetching expenses:', error)
      toast.error('Chyba při načítání nákladů')
    }
  }

  // Fetch budgets
  const fetchBudgets = async () => {
    try {
      const { data, error } = await supabase
        .from(TABLES.FINANCIAL_BUDGETS)
        .select(`
          *,
          category:cost_categories(name, color)
        `)
        .order('year', { ascending: false })

      if (error) throw error
      setBudgets(data || [])
    } catch (error) {
      console.error('Error fetching budgets:', error)
      toast.error('Chyba při načítání rozpočtů')
    }
  }

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        if (activeSection === 'dashboard') {
          await fetchDashboardData()
        } else if (activeSection === 'naklady') {
          await fetchExpenses()
        } else if (activeSection === 'rozpocty') {
          await fetchBudgets()
        }
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [activeSection, dateRange, projectFilter, categoryFilter])

  // Refresh data
  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      if (activeSection === 'dashboard') {
        await fetchDashboardData()
      } else if (activeSection === 'naklady') {
        await fetchExpenses()
      } else if (activeSection === 'rozpocty') {
        await fetchBudgets()
      }
    } finally {
      setIsRefreshing(false)
    }
  }

  // Filter expenses by search
  useEffect(() => {
    if (activeSection === 'naklady') {
      fetchExpenses()
    }
  }, [searchQuery])

  // Navigation
  useEffect(() => {
    if (section && section !== activeSection) {
      setActiveSection(section)
    }
  }, [section])

  const navigateToSection = (sectionId) => {
    setActiveSection(sectionId)
    navigate(`/finance/${sectionId}`, { replace: true })
  }

  // Render KPI card
  const KPICard = ({ title, value, change, trend, icon: Icon, color = 'blue' }) => {
    const colorClasses = {
      blue: 'bg-blue-100 text-blue-600',
      green: 'bg-green-100 text-green-600',
      red: 'bg-red-100 text-red-600',
      yellow: 'bg-yellow-100 text-yellow-600',
      purple: 'bg-purple-100 text-purple-600'
    }

    return (
      <div className="card p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={cn('w-12 h-12 rounded-lg flex items-center justify-center', colorClasses[color])}>
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">{title}</p>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
            </div>
          </div>
          {change !== undefined && (
            <div className={cn(
              'flex items-center space-x-1',
              trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600'
            )}>
              {trend === 'up' && <ArrowUp className="h-4 w-4" />}
              {trend === 'down' && <ArrowDown className="h-4 w-4" />}
              <span className="text-sm font-medium">{Math.abs(change)}%</span>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (isLoading && !dashboardData) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Finance</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-6">
              <div className="animate-pulse space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                    <div className="h-6 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <ChartSkeleton />
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
          <Calculator className="h-8 w-8 text-astra-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Finance</h1>
            <p className="text-gray-600">Komplexní finanční přehled a správa</p>
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
          
          {hasPermission('EDIT_FINANCES') && (
            <Link to="/finance/naklady/novy" className="btn-primary">
              <Plus className="h-4 w-4 mr-2" />
              Nový náklad
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

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="input w-auto"
          >
            <option value="current_month">Aktuální měsíc</option>
            <option value="last_month">Minulý měsíc</option>
            <option value="current_year">Aktuální rok</option>
            <option value="last_year">Minulý rok</option>
            <option value="all">Vše</option>
          </select>

          {activeSection === 'naklady' && (
            <>
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Hledat náklady..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input pl-10"
                  />
                </div>
              </div>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="input w-auto"
              >
                <option value="all">Všechny kategorie</option>
                <option value="mzdy">Mzdy</option>
                <option value="material">Materiál</option>
                <option value="pohonne_hmoty">Pohonné hmoty</option>
                <option value="servis">Servis a údržba</option>
              </select>

              <select
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                className="input w-auto"
              >
                <option value="all">Všechny projekty</option>
                <option value="provozni">Provozní náklady</option>
              </select>
            </>
          )}
        </div>
      </div>

      {/* Content based on active section */}
      {activeSection === 'dashboard' && dashboardData && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <KPICard
              title="Celkové náklady"
              value={formatCurrency(dashboardData.metrics.totalExpenses)}
              icon={DollarSign}
              color="red"
            />
            <KPICard
              title="Celkové tržby"
              value={formatCurrency(dashboardData.metrics.totalRevenue)}
              icon={TrendingUp}
              color="green"
            />
            <KPICard
              title="Zisk"
              value={formatCurrency(dashboardData.metrics.profit)}
              icon={Target}
              color="blue"
            />
            <KPICard
              title="Marže"
              value={`${dashboardData.metrics.profitMargin.toFixed(1)}%`}
              icon={Calculator}
              color="purple"
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Trend */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Trend posledních 6 měsíců</h3>
              <div className="h-64 flex items-end justify-between space-x-2">
                {dashboardData.monthlyTrend.map((data, index) => {
                  const maxValue = Math.max(...dashboardData.monthlyTrend.map(d => Math.max(d.revenue, d.expenses)))
                  const revenueHeight = (data.revenue / maxValue) * 200
                  const expenseHeight = (data.expenses / maxValue) * 200
                  
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center space-y-1">
                      <div className="flex space-x-1 items-end">
                        <div 
                          className="bg-green-500 w-4 rounded-t"
                          style={{ height: `${revenueHeight}px` }}
                          title={`Tržby: ${formatCurrency(data.revenue)}`}
                        ></div>
                        <div 
                          className="bg-red-500 w-4 rounded-t"
                          style={{ height: `${expenseHeight}px` }}
                          title={`Náklady: ${formatCurrency(data.expenses)}`}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-500">{data.month}</span>
                    </div>
                  )
                })}
              </div>
              <div className="flex justify-center space-x-6 mt-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span className="text-sm text-gray-600">Tržby</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded"></div>
                  <span className="text-sm text-gray-600">Náklady</span>
                </div>
              </div>
            </div>

            {/* Expenses by Category */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Náklady podle kategorií</h3>
              <div className="space-y-3">
                {Object.entries(dashboardData.expensesByCategory).map(([category, amount], index) => {
                  const total = Object.values(dashboardData.expensesByCategory).reduce((sum, val) => sum + val, 0)
                  const percentage = calculatePercentage(amount, total)
                  const colors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500', 'bg-purple-500']
                  
                  return (
                    <div key={category} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900">{category}</span>
                        <span className="text-sm text-gray-600">{formatCurrency(amount)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={cn('h-2 rounded-full transition-all duration-300', colors[index % colors.length])}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-500">{percentage}% z celkových nákladů</div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Recent Expenses */}
          <div className="card">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Nedávné náklady</h3>
                <Link to="/finance/naklady" className="text-sm text-astra-600 hover:text-astra-700">
                  Zobrazit vše
                </Link>
              </div>
            </div>
            <div className="divide-y divide-gray-200">
              {dashboardData.recentExpenses.map((expense) => (
                <div key={expense.id} className="p-6 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Receipt className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{expense.description}</p>
                      <p className="text-sm text-gray-600">
                        {expense.category?.name} • {formatDate(expense.expense_date)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{formatCurrency(expense.amount)}</p>
                    {expense.project && (
                      <p className="text-sm text-gray-600">{expense.project.name}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeSection === 'naklady' && (
        <div className="card">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Náklady</h3>
              {hasPermission('EDIT_FINANCES') && (
                <Link to="/finance/naklady/novy" className="btn-primary">
                  <Plus className="h-4 w-4 mr-2" />
                  Nový náklad
                </Link>
              )}
            </div>
          </div>
          
          {expenses.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
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
                    <th>Projekt</th>
                    <th>Částka bez DPH</th>
                    <th>DPH</th>
                    <th>Celkem</th>
                    <th>Akce</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((expense) => {
                    const vatCalc = calculateVAT(expense.amount_without_vat || expense.amount, expense.vat_rate || 21)
                    
                    return (
                      <tr key={expense.id}>
                        <td>{formatDate(expense.expense_date)}</td>
                        <td>
                          <div>
                            <p className="font-medium text-gray-900">{expense.description}</p>
                            <p className="text-sm text-gray-600">
                              {expense.created_by?.first_name} {expense.created_by?.last_name}
                            </p>
                          </div>
                        </td>
                        <td>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {expense.category?.name || 'Ostatní'}
                          </span>
                        </td>
                        <td>
                          {expense.project ? (
                            <span className="text-sm text-gray-900">{expense.project.name}</span>
                          ) : (
                            <span className="text-sm text-gray-500">Provozní</span>
                          )}
                        </td>
                        <td className="font-medium">{formatCurrency(vatCalc.net)}</td>
                        <td className="text-sm text-gray-600">
                          {expense.vat_rate}% ({formatCurrency(vatCalc.vat)})
                        </td>
                        <td className="font-bold">{formatCurrency(vatCalc.gross)}</td>
                        <td>
                          <div className="flex items-center space-x-2">
                            <button className="p-1 text-gray-400 hover:text-astra-600">
                              <Eye className="h-4 w-4" />
                            </button>
                            {hasPermission('EDIT_FINANCES') && (
                              <button className="p-1 text-gray-400 hover:text-blue-600">
                                <Edit className="h-4 w-4" />
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
      )}

      {/* Other sections would be implemented similarly */}
      {activeSection === 'analyzy' && (
        <div className="text-center py-12">
          <PieChart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Analýzy</h3>
          <p className="text-gray-600">Pokročilé finanční analýzy budou brzy k dispozici</p>
        </div>
      )}

      {activeSection === 'rozpocty' && (
        <div className="text-center py-12">
          <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Rozpočty</h3>
          <p className="text-gray-600">Správa rozpočtů bude brzy k dispozici</p>
        </div>
      )}

      {activeSection === 'dph' && (
        <div className="text-center py-12">
          <Calculator className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">DPH</h3>
          <p className="text-gray-600">Správa DPH a daňových povinností bude brzy k dispozici</p>
        </div>
      )}

      {activeSection === 'reporty' && (
        <div className="text-center py-12">
          <Download className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Reporty</h3>
          <p className="text-gray-600">Generování finančních reportů bude brzy k dispozici</p>
        </div>
      )}
    </div>
  )
}

export default FinancePage
