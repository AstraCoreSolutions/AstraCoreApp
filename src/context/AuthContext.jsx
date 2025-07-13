import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../utils/supabase'
import toast from 'react-hot-toast'

const AuthContext = createContext({
  user: null,
  profile: null,
  loading: true,
  signIn: async () => {},
  signOut: async () => {},
  updateProfile: async () => {},
  resetPassword: async () => {},
  hasPermission: () => false,
  userRole: null,
})

// User roles hierarchy
const USER_ROLES = {
  OWNER: 'owner',
  MANAGER: 'manager', 
  SITE_MANAGER: 'site_manager',
  ASSISTANT: 'assistant',
  EMPLOYEE: 'employee'
}

// Permissions mapping
const PERMISSIONS = {
  // Finance
  VIEW_FINANCES: ['owner', 'manager'],
  EDIT_FINANCES: ['owner'],
  APPROVE_EXPENSES: ['owner', 'manager'],
  
  // Projects
  VIEW_ALL_PROJECTS: ['owner', 'manager'],
  EDIT_PROJECTS: ['owner', 'manager', 'site_manager'],
  DELETE_PROJECTS: ['owner'],
  
  // Employees
  VIEW_EMPLOYEES: ['owner', 'manager', 'assistant'],
  EDIT_EMPLOYEES: ['owner', 'manager'],
  VIEW_SALARIES: ['owner'],
  
  // Fleet & Inventory
  VIEW_FLEET: ['owner', 'manager', 'site_manager'],
  EDIT_FLEET: ['owner', 'manager'],
  
  // Properties
  VIEW_PROPERTIES: ['owner', 'manager'],
  EDIT_PROPERTIES: ['owner', 'manager'],
  
  // Settings
  SYSTEM_SETTINGS: ['owner'],
  USER_MANAGEMENT: ['owner'],
  
  // Reports
  FINANCIAL_REPORTS: ['owner', 'manager'],
  EXPORT_DATA: ['owner', 'manager'],
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  // Initialize auth state
  useEffect(() => {
    // Get initial session
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting session:', error)
          throw error
        }

        if (session?.user) {
          setUser(session.user)
          await fetchUserProfile(session.user.id)
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        toast.error('Chyba při načítání autentizace')
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth event:', event, session?.user?.email)
        
        if (session?.user) {
          setUser(session.user)
          await fetchUserProfile(session.user.id)
        } else {
          setUser(null)
          setProfile(null)
        }
        
        setLoading(false)
      }
    )

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  // Fetch user profile from database
  const fetchUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select(`
          *,
          employee:employees(*)
        `)
        .eq('id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      // If no profile exists, create default one
      if (!data) {
        const newProfile = {
          id: userId,
          role: 'employee',
          first_name: '',
          last_name: '',
          created_at: new Date().toISOString()
        }

        const { data: createdProfile, error: createError } = await supabase
          .from('user_profiles')
          .insert([newProfile])
          .select()
          .single()

        if (createError) throw createError
        setProfile(createdProfile)
      } else {
        setProfile(data)
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
      toast.error('Chyba při načítání profilu uživatele')
    }
  }

  // Sign in function
  const signIn = async (email, password) => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password
      })

      if (error) {
        // Handle specific error cases
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Neplatné přihlašovací údaje')
        } else if (error.message.includes('Email not confirmed')) {
          throw new Error('Email nebyl potvrzen')
        } else if (error.message.includes('Too many requests')) {
          throw new Error('Příliš mnoho pokusů o přihlášení. Zkuste to později.')
        } else {
          throw new Error('Chyba při přihlašování')
        }
      }

      if (!data.user) {
        throw new Error('Přihlášení selhalo')
      }

      toast.success('Úspěšně přihlášen')
      return { success: true, user: data.user }

    } catch (error) {
      console.error('Sign in error:', error)
      toast.error(error.message)
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  // Sign out function
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        throw error
      }

      setUser(null)
      setProfile(null)
      toast.success('Úspěšně odhlášen')
      
      return { success: true }
    } catch (error) {
      console.error('Sign out error:', error)
      toast.error('Chyba při odhlašování')
      return { success: false, error: error.message }
    }
  }

  // Update user profile
  const updateProfile = async (updates) => {
    try {
      if (!user) throw new Error('Uživatel není přihlášen')

      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select()
        .single()

      if (error) throw error

      setProfile(data)
      toast.success('Profil aktualizován')
      
      return { success: true, profile: data }
    } catch (error) {
      console.error('Update profile error:', error)
      toast.error('Chyba při aktualizaci profilu')
      return { success: false, error: error.message }
    }
  }

  // Reset password
  const resetPassword = async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        {
          redirectTo: `${window.location.origin}/reset-password`
        }
      )

      if (error) throw error

      toast.success('Email pro reset hesla byl odeslán')
      return { success: true }
    } catch (error) {
      console.error('Reset password error:', error)
      toast.error('Chyba při odesílání emailu pro reset hesla')
      return { success: false, error: error.message }
    }
  }

  // Check user permission
  const hasPermission = (permission) => {
    if (!profile?.role) return false
    
    const allowedRoles = PERMISSIONS[permission]
    if (!allowedRoles) return false
    
    return allowedRoles.includes(profile.role)
  }

  // Get user role display name
  const getRoleDisplayName = (role) => {
    const roleNames = {
      [USER_ROLES.OWNER]: 'Majitel',
      [USER_ROLES.MANAGER]: 'Manažer',
      [USER_ROLES.SITE_MANAGER]: 'Stavbyvedoucí',
      [USER_ROLES.ASSISTANT]: 'Asistentka',
      [USER_ROLES.EMPLOYEE]: 'Zaměstnanec'
    }
    return roleNames[role] || 'Neznámá role'
  }

  // Check if user is admin (owner or manager)
  const isAdmin = () => {
    return profile?.role === USER_ROLES.OWNER || profile?.role === USER_ROLES.MANAGER
  }

  // Get user display name
  const getDisplayName = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name} ${profile.last_name}`
    }
    if (profile?.first_name) {
      return profile.first_name
    }
    return user?.email?.split('@')[0] || 'Uživatel'
  }

  const value = {
    user,
    profile,
    loading,
    signIn,
    signOut,
    updateProfile,
    resetPassword,
    hasPermission,
    userRole: profile?.role,
    isAdmin,
    getDisplayName,
    getRoleDisplayName,
    USER_ROLES,
    PERMISSIONS
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext
