import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { useAuth } from './hooks/useAuth'

// Components
import LoginPage from './components/auth/LoginPage'
import Dashboard from './components/dashboard/Dashboard'
import Layout from './components/layout/Layout'
import LoadingSpinner from './components/ui/LoadingSpinner'

// Pages
import ProjectsPage from './components/projects/ProjectsPage'
import ProjectDetail from './components/projects/ProjectDetail'
import FinancePage from './components/finance/FinancePage'
import EmployeesPage from './components/employees/EmployeesPage'
import FleetPage from './components/fleet/FleetPage'
import PropertiesPage from './components/properties/PropertiesPage'
import SettingsPage from './components/settings/SettingsPage'

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// Public Route Component (redirect if authenticated)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

// Main App Component
const AppContent = () => {
  const { user, loading } = useAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Offline notification
  const OfflineNotification = () => {
    if (isOnline) return null;
    
    return (
      <div className="fixed top-0 left-0 right-0 bg-warning-500 text-white px-4 py-2 text-center z-50">
        <span className="font-medium">⚠️ Jste offline</span>
        <span className="ml-2 text-sm">Některé funkce nemusí být dostupné</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-astra-500 to-astra-700 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg font-medium">Načítání AstraCore...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <OfflineNotification />
      <Routes>
        {/* Public routes */}
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          } 
        />
        
        {/* Protected routes */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          {/* Dashboard */}
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          
          {/* Zakázky */}
          <Route path="zakazky" element={<ProjectsPage type="zakazka" />} />
          <Route path="zakazky/:id" element={<ProjectDetail />} />
          
          {/* Vlastní projekty */}
          <Route path="projekty" element={<ProjectsPage type="projekt" />} />
          <Route path="projekty/:id" element={<ProjectDetail />} />
          
          {/* Nemovitosti */}
          <Route path="nemovitosti" element={<PropertiesPage />} />
          <Route path="nemovitosti/:id" element={<ProjectDetail type="property" />} />
          
          {/* Finance */}
          <Route path="finance" element={<FinancePage />} />
          <Route path="finance/:section" element={<FinancePage />} />
          
          {/* Zaměstnanci */}
          <Route path="zamestnanci" element={<EmployeesPage />} />
          <Route path="zamestnanci/:id" element={<EmployeesPage />} />
          
          {/* Flotila & Inventář */}
          <Route path="flotila" element={<FleetPage />} />
          <Route path="flotila/:section" element={<FleetPage />} />
          
          {/* Nastavení */}
          <Route path="nastaveni" element={<SettingsPage />} />
          <Route path="nastaveni/:section" element={<SettingsPage />} />
        </Route>
        
        {/* 404 Page */}
        <Route 
          path="*" 
          element={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-6xl font-bold text-gray-400 mb-4">404</h1>
                <p className="text-xl text-gray-600 mb-8">Stránka nenalezena</p>
                <button
                  onClick={() => window.history.back()}
                  className="bg-astra-500 hover:bg-astra-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Zpět
                </button>
              </div>
            </div>
          } 
        />
      </Routes>
    </>
  );
};

// Root App Component with Providers
function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <div className="App">
            <AppContent />
            
            {/* Toast notifications */}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#fff',
                  color: '#374151',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.75rem',
                  padding: '16px',
                },
                success: {
                  iconTheme: {
                    primary: '#10b981',
                    secondary: '#fff',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#fff',
                  },
                },
                loading: {
                  iconTheme: {
                    primary: '#627d98',
                    secondary: '#fff',
                  },
                },
              }}
            />
          </div>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
