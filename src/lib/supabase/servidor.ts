import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"

export async function crearClienteServidor() {
  const tiendaCookies = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return tiendaCookies.getAll()
        },
        setAll(cookiesParaEstablecer) {
          try {
            cookiesParaEstablecer.forEach(({ name, value, options }) =>
              tiendaCookies.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}

export function crearClienteAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
