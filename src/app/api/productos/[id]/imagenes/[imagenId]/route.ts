import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { crearClienteServidor } from "@/lib/supabase/servidor"
import type { RespuestaAPI } from "@/tipos"

export async function PATCH(
  solicitud: NextRequest,
  { params }: { params: Promise<{ id: string; imagenId: string }> }
) {
  try {
    const supabase = await crearClienteServidor()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json<RespuestaAPI<null>>(
        { error: "No autorizado" },
        { status: 401 }
      )
    }

    const { id: productoId, imagenId } = await params
    const { posicion } = await solicitud.json() as { posicion: number }

    if (typeof posicion !== "number" || posicion < 0 || posicion > 100) {
      return NextResponse.json<RespuestaAPI<null>>(
        { error: "La posición debe ser un número entre 0 y 100" },
        { status: 400 }
      )
    }

    const imagen = await prisma.imagenProducto.update({
      where: { id: imagenId, productoId },
      data: { posicion },
    })

    return NextResponse.json<RespuestaAPI<typeof imagen>>({ datos: imagen })
  } catch (error) {
    console.error("Error al actualizar posición de imagen:", error)
    return NextResponse.json<RespuestaAPI<null>>(
      { error: "Error al actualizar la posición" },
      { status: 500 }
    )
  }
}
