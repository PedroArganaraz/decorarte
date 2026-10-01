import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import type { RespuestaAPI } from "@/tipos"

export async function PATCH(
  solicitud: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { marcado } = await solicitud.json() as { marcado: boolean }

    if (typeof marcado !== "boolean") {
      return NextResponse.json<RespuestaAPI<null>>(
        { error: "El campo marcado debe ser boolean" },
        { status: 400 }
      )
    }

    await prisma.producto.update({
      where: { id },
      data: { marcado },
    })

    return NextResponse.json<RespuestaAPI<null>>({ datos: null })
  } catch (error) {
    console.error("Error al actualizar marcado:", error)
    return NextResponse.json<RespuestaAPI<null>>(
      { error: "Error al actualizar el producto" },
      { status: 500 }
    )
  }
}
