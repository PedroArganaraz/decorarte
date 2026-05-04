import { NextRequest, NextResponse } from "next/server"
import { crearClienteServidor } from "@/lib/supabase/servidor"

export async function GET(solicitud: NextRequest) {
  const { searchParams, origin } = new URL(solicitud.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/panel"

  if (code) {
    const supabase = await crearClienteServidor()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=callback`)
}
