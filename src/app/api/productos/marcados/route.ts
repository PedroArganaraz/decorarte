import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import type { RespuestaAPI } from "@/tipos"

export async function PATCH(solicitud: NextRequest) {
  try {
    const { productos } = await solicitud.json() as {
      productos: { id: string; marcado: boolean }[]
    }

    if (!Array.isArray(productos) || productos.length === 0) {
      return NextResponse.json<RespuestaAPI<null>>(
        { error: "Se requiere un array de productos" },
        { status: 400 }
      )
    }

    await prisma.$transaction(
      productos.map(({ id, marcado }) =>
        prisma.producto.update({ where: { id }, data: { marcado } })
      )
    )

    return NextResponse.json<RespuestaAPI<null>>({ datos: null })
  } catch (error) {
    console.error("Error al actualizar marcados:", error)
    return NextResponse.json<RespuestaAPI<null>>(
      { error: "Error al actualizar los productos" },
      { status: 500 }
    )
  }
}
