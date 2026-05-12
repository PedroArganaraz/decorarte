import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { crearClienteServidor } from "@/lib/supabase/servidor"
import type { RespuestaAPI } from "@/tipos"

export async function GET() {
  try {
    const config = await prisma.configHero.findUnique({ where: { id: 1 } })
    return NextResponse.json<RespuestaAPI<{ intervalo: number }>>({
      datos: { intervalo: config?.intervalo ?? 3 },
    })
  } catch {
    return NextResponse.json<RespuestaAPI<{ intervalo: number }>>({
      datos: { intervalo: 3 },
    })
  }
}

export async function PATCH(solicitud: NextRequest) {
  try {
    const supabase = await crearClienteServidor()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json<RespuestaAPI<null>>({ error: "No autorizado" }, { status: 401 })
    }

    const { intervalo } = await solicitud.json() as { intervalo: number }

    if (!Number.isInteger(intervalo) || intervalo < 1 || intervalo > 60) {
      return NextResponse.json<RespuestaAPI<null>>({ error: "Intervalo inválido" }, { status: 400 })
    }

    const config = await prisma.configHero.upsert({
      where: { id: 1 },
      create: { id: 1, intervalo },
      update: { intervalo },
    })

    return NextResponse.json<RespuestaAPI<typeof config>>({ datos: config })
  } catch (error) {
    console.error("Error al actualizar config hero:", error)
    return NextResponse.json<RespuestaAPI<null>>({ error: "Error al guardar" }, { status: 500 })
  }
}
