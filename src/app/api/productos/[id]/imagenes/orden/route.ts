import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { crearClienteServidor } from "@/lib/supabase/servidor"
import type { RespuestaAPI } from "@/tipos"

export async function PATCH(
  solicitud: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await crearClienteServidor()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json<RespuestaAPI<null>>({ error: "No autorizado" }, { status: 401 })

    await params
    const { imagenes } = await solicitud.json() as { imagenes: { id: string; orden: number }[] }

    if (!Array.isArray(imagenes) || imagenes.length === 0) {
      return NextResponse.json<RespuestaAPI<null>>({ error: "Faltan datos" }, { status: 400 })
    }

    await prisma.$transaction(
      imagenes.map(({ id, orden }) =>
        prisma.imagenProducto.update({ where: { id }, data: { orden } })
      )
    )

    return NextResponse.json<RespuestaAPI<null>>({ datos: null })
  } catch (error) {
    console.error("Error al reordenar imágenes:", error)
    return NextResponse.json<RespuestaAPI<null>>({ error: "Error al reordenar" }, { status: 500 })
  }
}
