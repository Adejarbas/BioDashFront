import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

const env = process.env

// Check if Supabase environment variables are available
export const isSupabaseConfigured =
  typeof env.NEXT_PUBLIC_SUPABASE_URL === "string" &&
  env.NEXT_PUBLIC_SUPABASE_URL!.length > 0 &&
  typeof env.NEXT_PUBLIC_SUPABASE_ANON_KEY === "string" &&
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY!.length > 0

export function createClient() {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase is not configured. Please check your environment variables.")
  }

  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
          const store = await cookieStore
          return store.get(name)?.value
        },
        async set(name: string, value: string, options: CookieOptions) {
          try {
            const store = await cookieStore
            store.set({ name, value, ...options })
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        async remove(name: string, options: CookieOptions) {
          try {
            const store = await cookieStore
            store.set({ name, value: '', ...options })
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}
