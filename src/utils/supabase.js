import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validate environment variables
if (!supabaseUrl) {
  throw new Error('Missing VITE_SUPABASE_URL environment variable')
}

if (!supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_ANON_KEY environment variable')
}

// Create Supabase client with options
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  global: {
    headers: {
      'X-Client-Info': 'astracore-solutions@1.0.0'
    }
  }
})

// Database table names (for consistency)
export const TABLES = {
  USER_PROFILES: 'user_profiles',
  EMPLOYEES: 'employees',
  PROJECTS: 'projects',
  EXPENSES: 'expenses',
  VEHICLES: 'vehicles',
  TOOLS: 'tools',
  PROPERTIES: 'properties',
  PROPERTY_TENANTS: 'property_tenants',
  CLIENTS: 'clients',
  DIARY_ENTRIES: 'diary_entries',
  FINANCIAL_BUDGETS: 'financial_budgets',
  COST_CATEGORIES: 'cost_categories',
  EXPENSE_APPROVALS: 'expense_approvals',
  TIME_TRACKING: 'time_tracking',
  VEHICLE_MAINTENANCE: 'vehicle_maintenance',
  TOOL_ASSIGNMENTS: 'tool_assignments',
  PROJECT_ASSIGNMENTS: 'project_assignments',
  NOTIFICATIONS: 'notifications',
  AUDIT_LOGS: 'audit_logs'
}

// Helper functions for common database operations

// Generic CRUD operations
export const dbOperations = {
  // Get all records with optional filters and sorting
  getAll: async (table, options = {}) => {
    try {
      let query = supabase.from(table).select(options.select || '*')
      
      // Apply filters
      if (options.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            query = query.eq(key, value)
          }
        })
      }
      
      // Apply sorting
      if (options.orderBy) {
        query = query.order(options.orderBy, { 
          ascending: options.ascending !== false 
        })
      }
      
      // Apply pagination
      if (options.from !== undefined && options.to !== undefined) {
        query = query.range(options.from, options.to)
      }
      
      const { data, error, count } = await query
      
      if (error) throw error
      
      return { data, count, error: null }
    } catch (error) {
      console.error(`Error fetching from ${table}:`, error)
      return { data: null, count: 0, error }
    }
  },

  // Get single record by ID
  getById: async (table, id, select = '*') => {
    try {
      const { data, error } = await supabase
        .from(table)
        .select(select)
        .eq('id', id)
        .single()
      
      if (error) throw error
      
      return { data, error: null }
    } catch (error) {
      console.error(`Error fetching ${table} by ID:`, error)
      return { data: null, error }
    }
  },

  // Create new record
  create: async (table, record) => {
    try {
      const { data, error } = await supabase
        .from(table)
        .insert([{
          ...record,
          created_at: new Date().toISOString()
        }])
        .select()
        .single()
      
      if (error) throw error
      
      return { data, error: null }
    } catch (error) {
      console.error(`Error creating ${table} record:`, error)
      return { data: null, error }
    }
  },

  // Update record by ID
  update: async (table, id, updates) => {
    try {
      const { data, error } = await supabase
        .from(table)
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      
      return { data, error: null }
    } catch (error) {
      console.error(`Error updating ${table} record:`, error)
      return { data: null, error }
    }
  },

  // Delete record by ID
  delete: async (table, id) => {
    try {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id)
      
      if (error) throw error
      
      return { error: null }
    } catch (error) {
      console.error(`Error deleting ${table} record:`, error)
      return { error }
    }
  }
}

// Storage operations
export const storageOperations = {
  // Upload file to storage bucket
  uploadFile: async (bucket, path, file, options = {}) => {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: options.upsert || false,
          ...options
        })
      
      if (error) throw error
      
      return { data, error: null }
    } catch (error) {
      console.error(`Error uploading file to ${bucket}:`, error)
      return { data: null, error }
    }
  },

  // Get public URL for file
  getPublicUrl: (bucket, path) => {
    try {
      const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(path)
      
      return data.publicUrl
    } catch (error) {
      console.error(`Error getting public URL for ${bucket}/${path}:`, error)
      return null
    }
  },

  // Delete file from storage
  deleteFile: async (bucket, paths) => {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .remove(Array.isArray(paths) ? paths : [paths])
      
      if (error) throw error
      
      return { data, error: null }
    } catch (error) {
      console.error(`Error deleting files from ${bucket}:`, error)
      return { data: null, error }
    }
  }
}

// Realtime subscriptions
export const subscriptions = {
  // Subscribe to table changes
  subscribeToTable: (table, callback, filters = {}) => {
    let channel = supabase
      .channel(`${table}-changes`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: table,
        ...filters
      }, callback)
      .subscribe()
    
    return channel
  },

  // Subscribe to specific record changes
  subscribeToRecord: (table, id, callback) => {
    return subscriptions.subscribeToTable(
      table, 
      callback, 
      { filter: `id=eq.${id}` }
    )
  },

  // Unsubscribe from channel
  unsubscribe: (channel) => {
    if (channel) {
      supabase.removeChannel(channel)
    }
  }
}

// Error handling utilities
export const handleSupabaseError = (error) => {
  if (!error) return null

  // Map common errors to user-friendly messages
  const errorMessages = {
    'auth/invalid-email': 'Neplatný formát emailu',
    'auth/user-not-found': 'Uživatel nenalezen',
    'auth/wrong-password': 'Nesprávné heslo',
    'auth/email-already-in-use': 'Email je již používán',
    'auth/weak-password': 'Heslo je příliš slabé',
    'auth/too-many-requests': 'Příliš mnoho pokusů, zkuste to později',
    '23505': 'Záznam s tímto identifikátorem již existuje',
    '23503': 'Nelze smazat, záznam je používán jinde',
    '42501': 'Nemáte oprávnění k této operaci',
    'PGRST116': 'Záznam nenalezen'
  }

  const message = errorMessages[error.code] || 
                 errorMessages[error.message] || 
                 error.message || 
                 'Došlo k neočekávané chybě'

  return {
    code: error.code,
    message,
    details: error.details,
    hint: error.hint
  }
}

// Connection status
export const getConnectionStatus = async () => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('count')
      .limit(1)
    
    return !error
  } catch (error) {
    return false
  }
}

// Health check
export const healthCheck = async () => {
  try {
    const start = Date.now()
    await supabase.from('user_profiles').select('count').limit(1)
    const latency = Date.now() - start
    
    return {
      status: 'healthy',
      latency,
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    }
  }
}

export default supabase
