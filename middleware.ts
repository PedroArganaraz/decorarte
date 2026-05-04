import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(solicitud: NextRequest) {
  let respuesta = NextResponse.next({ request: solicitud })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return solicitud.cookies.getAll()
        },
        setAll(cookiesParaEstablecer) {
          cookiesParaEstablecer.forEach(({ name, value }) =>
            solicitud.cookies.set(name, value)
          )
          respuesta = NextResponse.next({ request: solicitud })
          cookiesParaEstablecer.forEach(({ name, value, options }) =>
            respuesta.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const estaEnPanel = solicitud.nextUrl.pathname.startsWith("/panel")
  const estaEnLogin = solicitud.nextUrl.pathname === "/auth/login"

  if (estaEnPanel && !user) {
    const url = solicitud.nextUrl.clone()
    url.pathname = "/auth/login"
    url.searchParams.set("redirigir", solicitud.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  if (estaEnLogin && user) {
    const url = solicitud.nextUrl.clone()
    url.pathname = "/panel"
    return NextResponse.redirect(url)
  }

  return respuesta
}

export const config = {
  matcher: ["/panel/:path*", "/auth/login"],
}
