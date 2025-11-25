'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Listener para mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth event:', event)
      
      if (event === 'SIGNED_IN' && session) {
        console.log('Usuário autenticado:', session.user.email)
      }
      
      if (event === 'SIGNED_OUT') {
        console.log('Usuário desconectado')
        localStorage.clear()
        sessionStorage.clear()
      }
      
      if (event === 'TOKEN_REFRESHED') {
        console.log('Token renovado')
      }
    })
    
    return () => subscription.unsubscribe()
  }, [])
  
  return <>{children}</>
}