import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useTheme } from '../../context/ThemeContext'
import { cn, formatCurrency, formatNumber, calculatePercentage } from '../../utils/helpers'
import {
  TrendingUp, TrendingDown, DollarSign, Users, Car, Building2,
  AlertTriangle, CheckCircle, Clock, Plus, Eye, Calendar,
  BarChart3, PieChart, Activity, Zap, Target, Briefcase,
  Home, Wrench, Euro, ArrowUp, ArrowDown, RefreshCw
} from 'lucide-react'

const Dashboard = () => {
  const { profile, hasPermission } = useAuth()
  const { formatCurrency: themeCurrency, formatDate } = useTheme()
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Mock data - v produkci by se načítala z API
  const [dashboardData, setDashboardData] = useState({
    kpis: {
      activeProjects: { value: 8, change: 2, trend: 'up' },
      monthlyRevenue: { value: 3450000, change: 15.5, trend: 'up' },
      expenses: { value: 2180000, change: -8.2, trend: 'down' },
      profit: { value: 1270000, change: 24.8, trend: 'up' },
      employees: { value: 12, change: 1, trend: 'up' },
      vehicles: { value: 6, change: 0, trend: 'stable' },
      properties: { value: 15, change: 2, trend: 'up' },
      efficiency: { value: 94.5, change: 3.2, trend: 'up' }
    },
    recentProjects: [
      {
        id: 1,
        name: 'Rekonstrukce kancelářského komplexu',
        client: 'ABC Development s.r.o.',
        status: 'realizace',
        progress: 74,
        budget: 2500000,
        spent: 1850000,
        deadline: '2025-09-15'
      },
      {
        id: 2,
        name: 'Bytový dům Praha 6',
        client: 'DEF Invest a.s.',
        status: 'nabidka',
        progress: 0,
        budget: 4200000,
        spent: 0,
        deadline: '2025-12-20'
      },
      {
        id: 3,
        name: 'Rodinný dům Brno',
        client: 'Novák Jan',
        status: 'realizace',
        progress: 45,
        budget: 1800000,
        spent: 810000,
        deadline: '2025-08-30'
      }
    ],
    upcomingDeadlines: [
      { task: 'Servis vozidla ABC-123', date: '2025-07-16', type: 'maintenance' },
      { task: 'Kolaudace - Kancelářský komplex', date: '2025-07-18', type: 'milestone' },
      { task: 'Platba faktury #2024/145', date: '2025-07-20', type: 'payment' },
      { task: 'Školení BOZP', date: '2025-07-22', type: 'training' }
    ],
    financialSummary: {
      cashflow: [
        { month: 'Leden', income: 2800000, expenses: 2100000 },
        { month: 'Únor', income: 3200000, expenses: 2300000 },
        { month: 'Březen', income: 2900000, expenses: 2400000 },
        { month: 'Duben', income: 3800000, expenses: 2600000 },
        { month: 'Květen', income: 3500000, expenses: 2200000 },
        { month: 'Červen', income: 4100000, expenses: 2800000 },
        { month: 'Červenec', income: 3450000, expenses: 2180000 }
      ],
      expenseCategories: [
        { name: 'Mzdy', value: 980000, color: '#627d98' },
        { name: 'Materiál', value: 650000, color: '#bfa094' },
        { name: 'Pohonné hmoty', value: 180000, color: '#10b981' },
        { name: 'Servis a údržba', value: 120000, color: '#f59e0b' },
        { name: 'Ostatní', value: 250000, color: '#ef4444' }
      ]
    }
  })

  // Simulate data loading
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000)
    return () => clearTimeout(timer)
  }, [])

  // Refresh data
  const handleRefresh = async () => {
    setRefreshing(true)
    // Simulate API call
    setTimeout(() => {
      setRefreshing(false)
      // In real app, refetch data here
    }, 1500)
  }

  // Get status color
  const getStatusColor = (status) => {
    const colors = {
      'realizace': 'bg-blue-100 text-blue-800',
      'nabidka': 'bg-yellow-100 text-yellow-800',
      'dokonceno': 'bg-green-100 text-green-800',
      'pozastaveno': 'bg-red-100 text-red-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  // Get deadline urgency
  const getDeadlineUrgency = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInDays = Math.ceil((date - now) / (1000 * 60 * 60 * 24))
    
    if (diffInDays <= 1) return 'urgent'
    if (diffInDays <= 3) return 'warning'
    if (diffInDays <= 7) return 'normal'
    return 'future'
  }

  // KPI Card Component
  const KPICard = ({ title, value, prefix = '', suffix = '', change, trend, icon: Icon, link }) => {
    const getTrendColor = () => {
      if (trend === 'up') return 'text-success-600'
      if (trend === 'down') return 'text-error-600'
      return 'text-gray-600'
    }

    const getTrendIcon = () => {
      if (trend === 'up') return <ArrowUp className="h-3 w-3" />
      if (trend === 'down') return <ArrowDown className="h-3 w-3" />
      return null
    }

    const card = (
      <div className="card p-6 hover:shadow-lg transition-all duration-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-astra-50 rounded-lg flex items-center justify-center">
              <Icon className="h-6 w-6 text-astra-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">{title}</p>
              <p className="text-2xl font-bold text-gray-900">
                {prefix}{typeof value === 'number' && value > 10000 ? formatNumber(value) : value}{suffix}
              </p>
            </div>
          </div>
          {change !== 0 && (
            <div className={cn('flex items-center space-x-1', getTrendColor())}>
              {getTrendIcon()}
              <span className="text-sm font-medium">
                {Math.abs(change)}%
              </span>
            </div>
          )}
        </div>
      </div>
    )

    return link ? <Link to={link}>{card}</Link> : card
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Loading skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
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
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Welcome Section */}
      <div className="bg-gradient-astra rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              Vítejte zpět, {profile?.first_name}!
            </h1>
            <p className="text-astra-100">
              Přehled vašich projektů a klíčových metrik za {formatDate(new Date(), { month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center space-x-2 px-4 py-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-colors"
            >
              <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
              <span>Obnovit</span>
            </button>
            {hasPermission('EDIT_PROJECTS') && (
              <Link
                to="/zakazky/nova"
                className="flex items-center space-x-2 px-4 py-2 bg-copper-500 rounded-lg hover:bg-copper-600 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Nový projekt</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Aktivní projekty"
          value={dashboardData.kpis.activeProjects.value}
          change={dashboardData.kpis.activeProjects.change}
          trend={dashboardData.kpis.activeProjects.trend}
          icon={Briefcase}
          link="/zakazky"
        />
        <KPICard
          title="Měsíční tržby"
          value={formatCurrency(dashboardData.kpis.monthlyRevenue.value)}
          change={dashboardData.kpis.monthlyRevenue.change}
          trend={dashboardData.kpis.monthlyRevenue.trend}
          icon={Euro}
          link="/finance"
        />
        <KPICard
          title="Náklady"
          value={formatCurrency(dashboardData.kpis.expenses.value)}
          change={dashboardData.kpis.expenses.change}
          trend={dashboardData.kpis.expenses.trend}
          icon={DollarSign}
          link="/finance/naklady"
        />
        <KPICard
          title="Zisk"
          value={formatCurrency(dashboardData.kpis.profit.value)}
          change={dashboardData.kpis.profit.change}
          trend={dashboardData.kpis.profit.trend}
          icon={TrendingUp}
          link="/finance/analyzy"
        />
        <KPICard
          title="Zaměstnanci"
          value={dashboardData.kpis.employees.value}
          change={dashboardData.kpis.employees.change}
          trend={dashboardData.kpis.employees.trend}
          icon={Users}
          link="/zamestnanci"
        />
        <KPICard
          title="Vozidla"
          value={dashboardData.kpis.vehicles.value}
          change={dashboardData.kpis.vehicles.change}
          trend={dashboardData.kpis.vehicles.trend}
          icon={Car}
          link="/flotila"
        />
        <KPICard
          title="Nemovitosti"
          value={dashboardData.kpis.properties.value}
          change={dashboardData.kpis.properties.change}
          trend={dashboardData.kpis.properties.trend}
          icon={Building2}
          link="/nemovitosti"
        />
        <KPICard
          title="Efektivita"
          value={dashboardData.kpis.efficiency.value}
          suffix="%"
          change={dashboardData.kpis.efficiency.change}
          trend={dashboardData.kpis.efficiency.trend}
          icon={Target}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Projects */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Aktuální projekty</h2>
                <Link to="/zakazky" className="text-sm text-astra-600 hover:text-astra-700">
                  Zobrazit vše
                </Link>
              </div>
            </div>
            <div className="divide-y divide-gray-200">
              {dashboardData.recentProjects.map((project) => (
                <div key={project.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-medium text-gray-900">{project.name}</h3>
                      <p className="text-sm text-gray-600">{project.client}</p>
                    </div>
                    <span className={cn('px-2 py-1 rounded-full text-xs font-medium', getStatusColor(project.status))}>
                      {project.status === 'realizace' && 'Realizace'}
                      {project.status === 'nabidka' && 'Nabídka'}
                      {project.status === 'dokonceno' && 'Dokončeno'}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Pokrok</span>
                      <span className="font-medium">{project.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-astra-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${project.progress}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-3 text-sm text-gray-600">
                    <span>Rozpočet: {formatCurrency(project.budget)}</span>
                    <span>Deadline: {formatDate(project.deadline)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Content */}
        <div className="space-y-6">
          {/* Upcoming Deadlines */}
          <div className="card">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Nadcházející termíny</h2>
            </div>
            <div className="p-6 space-y-4">
              {dashboardData.upcomingDeadlines.map((deadline, index) => {
                const urgency = getDeadlineUrgency(deadline.date)
                return (
                  <div key={index} className="flex items-center space-x-3">
                    <div className={cn(
                      'w-2 h-2 rounded-full',
                      urgency === 'urgent' && 'bg-error-500',
                      urgency === 'warning' && 'bg-warning-500',
                      urgency === 'normal' && 'bg-info-500',
                      urgency === 'future' && 'bg-gray-400'
                    )}></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{deadline.task}</p>
                      <p className="text-xs text-gray-500">{formatDate(deadline.date)}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Rychlé akce</h2>
            <div className="space-y-3">
              {hasPermission('EDIT_PROJECTS') && (
                <Link
                  to="/zakazky/nova"
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Plus className="h-5 w-5 text-astra-600" />
                  <span className="font-medium">Nový projekt</span>
                </Link>
              )}
              <Link
                to="/finance/naklady/novy"
                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <DollarSign className="h-5 w-5 text-astra-600" />
                <span className="font-medium">Přidat náklad</span>
              </Link>
              <Link
                to="/zamestnanci/docházka"
                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Clock className="h-5 w-5 text-astra-600" />
                <span className="font-medium">Docházka</span>
              </Link>
              <Link
                to="/finance/reporty"
                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <BarChart3 className="h-5 w-5 text-astra-600" />
                <span className="font-medium">Reporty</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Summary Charts */}
      {hasPermission('VIEW_FINANCES') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Cashflow (7 měsíců)</h2>
            <div className="h-64 flex items-end justify-between space-x-2">
              {dashboardData.financialSummary.cashflow.map((data, index) => {
                const maxValue = Math.max(...dashboardData.financialSummary.cashflow.map(d => Math.max(d.income, d.expenses)))
                const incomeHeight = (data.income / maxValue) * 200
                const expenseHeight = (data.expenses / maxValue) * 200
                
                return (
                  <div key={index} className="flex-1 flex flex-col items-center space-y-1">
                    <div className="flex space-x-1 items-end">
                      <div 
                        className="bg-astra-500 w-4 rounded-t"
                        style={{ height: `${incomeHeight}px` }}
                        title={`Příjmy: ${formatCurrency(data.income)}`}
                      ></div>
                      <div 
                        className="bg-copper-500 w-4 rounded-t"
                        style={{ height: `${expenseHeight}px` }}
                        title={`Výdaje: ${formatCurrency(data.expenses)}`}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-500 transform -rotate-45 origin-center mt-2">
                      {data.month.slice(0, 3)}
                    </span>
                  </div>
                )
              })}
            </div>
            <div className="flex justify-center space-x-6 mt-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-astra-500 rounded"></div>
                <span className="text-sm text-gray-600">Příjmy</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-copper-500 rounded"></div>
                <span className="text-sm text-gray-600">Výdaje</span>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Struktura nákladů</h2>
            <div className="space-y-3">
              {dashboardData.financialSummary.expenseCategories.map((category, index) => {
                const total = dashboardData.financialSummary.expenseCategories.reduce((sum, cat) => sum + cat.value, 0)
                const percentage = calculatePercentage(category.value, total)
                
                return (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">{category.name}</span>
                      <span className="text-sm text-gray-600">{formatCurrency(category.value)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${percentage}%`,
                          backgroundColor: category.color 
                        }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500">{percentage}% z celkových nákladů</div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard
