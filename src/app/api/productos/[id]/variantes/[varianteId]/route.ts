import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { crearClienteServidor } from "@/lib/supabase/servidor"
import type { RespuestaAPI } from "@/tipos"

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; varianteId: string }> }
) {
  try {
    const supabase = await crearClienteServidor()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json<RespuestaAPI<null>>({ error: "No autorizado" }, { status: 401 })

    const { varianteId } = await params
    const id = Number(varianteId)

    if (isNaN(id)) {
      return NextResponse.json<RespuestaAPI<null>>({ error: "varianteId inválido" }, { status: 400 })
    }

    await prisma.varianteColor.delete({ where: { id } })

    return NextResponse.json<RespuestaAPI<null>>({ datos: null })
  } catch (error) {
    console.error("Error al desvincular variante de color:", error)
    return NextResponse.json<RespuestaAPI<null>>({ error: "Error interno" }, { status: 500 })
  }
}
