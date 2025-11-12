import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { AuthContext, type AuthContextValue } from './AuthContext'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthContextValue['user']>(null)
  const [session, setSession] = useState<AuthContextValue['session']>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!isMounted) return

        if (error) {
          console.error('Failed to fetch auth session', error)
          setUser(null)
          setSession(null)
          setIsLoading(false)
          return
        }

        setSession(data.session)
        setUser(data.session?.user ?? null)
        setIsLoading(false)
      })
      .catch((error) => {
        if (!isMounted) return
        console.error('Unexpected error retrieving session', error)
        setIsLoading(false)
      })

    const {
      data: authListener,
    } = supabase.auth.onAuthStateChange((_event, authSession) => {
      setSession(authSession)
      setUser(authSession?.user ?? null)
      setIsLoading(false)
    })

    return () => {
      isMounted = false
      authListener.subscription.unsubscribe()
    }
  }, [])

  const signIn = useCallback<AuthContextValue['signIn']>(async ({ email, password }) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      throw error
    }
  }, [])

  const signUp = useCallback<AuthContextValue['signUp']>(async ({ email, password }) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      throw error
    }
  }, [])

  const signOut = useCallback<AuthContextValue['signOut']>(async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      throw error
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      isLoading,
      signIn,
      signUp,
      signOut,
    }),
    [isLoading, session, signIn, signOut, signUp, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

