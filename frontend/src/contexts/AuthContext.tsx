import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase, supabaseConfig } from '../lib/supabase'
import { UserRole } from '@/lib/rbac'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  userRole: UserRole | null
  isApproved: boolean
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<{ error: AuthError | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [isApproved, setIsApproved] = useState(false)
  const authEnabled = supabaseConfig.isConfigured

  const createAuthDisabledError = (): AuthError => ({
    name: 'AuthNotConfigured',
    message: 'Authentication is not configured for this environment.',
    status: 503
  } as AuthError)

  // Check user role and approval status
  const resolveRoleFromMetadata = (user: User | null): { role: UserRole; approved: boolean } | null => {
    if (!user) return null
    const metadata = (user.user_metadata ?? {}) as { role?: string; approved?: boolean }
    if (metadata.role && ['admin', 'analyst', 'viewer'].includes(metadata.role)) {
      return {
        role: metadata.role as UserRole,
        approved: metadata.approved ?? metadata.role !== 'viewer'
      }
    }
    return null
  }

  const checkUserStatus = async (user: User | null) => {
    const metadataRole = resolveRoleFromMetadata(user)
    if (metadataRole) {
      setUserRole(metadataRole.role)
      setIsApproved(metadataRole.approved)
      return
    }

    if (!user) {
      setUserRole(null)
      setIsApproved(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('roles')
        .select('role')
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking user role from roles table:', error)
      }

      if (data?.role && ['admin', 'analyst', 'viewer'].includes(data.role)) {
        setUserRole(data.role as UserRole)
        setIsApproved(data.role !== 'viewer')
        return
      }
    } catch (err) {
      console.error('Error resolving user role:', err)
    }

    setUserRole('viewer')
    setIsApproved(true)
  }

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      if (!authEnabled) {
        setUser(null)
        setSession(null)
        setUserRole('admin')
        setIsApproved(true)
        setLoading(false)
        return
      }

      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) {
        console.error('Error getting session:', error)
      } else {
        setSession(session)
        setUser(session?.user ?? null)
        if (session?.user) {
          await checkUserStatus(session.user)
        }
      }
      setLoading(false)
    }

    getInitialSession()

    if (!authEnabled) {
      return
    }

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        if (session?.user) {
          await checkUserStatus(session.user)
        } else {
          setUserRole(null)
          setIsApproved(false)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [authEnabled])

  const signUp = async (email: string, password: string) => {
    if (!authEnabled) {
      return { error: createAuthDisabledError() }
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: 'viewer',
          approved: false
        }
      }
    })

    return { error }
  }

  const signIn = async (email: string, password: string) => {
    if (!authEnabled) {
      return { error: createAuthDisabledError() }
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error }
  }

  const signOut = async () => {
    if (!authEnabled) {
      return { error: createAuthDisabledError() }
    }

    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Sign out error:', error)
        return { error }
      }
      // Clear local state
      setUser(null)
      setSession(null)
      setUserRole(null)
      setIsApproved(false)
      return { error: null }
    } catch (err: any) {
      console.error('Sign out error:', err)
      return { error: err }
    }
  }

  const value = {
    user,
    session,
    loading,
    userRole,
    isApproved,
    signUp,
    signIn,
    signOut,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
