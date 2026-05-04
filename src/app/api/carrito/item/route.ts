import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import type { RespuestaAPI } from "@/tipos"

function obtenerSessionId(solicitud: NextRequest): string | null {
  return solicitud.cookies.get("decorarte_session")?.value ?? null
}

export async function PATCH(solicitud: NextRequest) {
  try {
    const sessionId = obtenerSessionId(solicitud)

    if (!sessionId) {
      return NextResponse.json<RespuestaAPI<null>>(
        { error: "Session no encontrada" },
        { status: 400 }
      )
    }

    const { productoId, cantidad } = await solicitud.json()

    if (!productoId || cantidad === undefined) {
      return NextResponse.json<RespuestaAPI<null>>(
        { error: "Datos inválidos" },
        { status: 400 }
      )
    }

    const carrito = await prisma.carrito.findUnique({ where: { sessionId } })

    if (!carrito) {
      return NextResponse.json<RespuestaAPI<null>>(
        { error: "Carrito no encontrado" },
        { status: 404 }
      )
    }

    if (cantidad <= 0) {
      await prisma.itemCarrito.deleteMany({
        where: { carritoId: carrito.id, productoId },
      })
      return NextResponse.json<RespuestaAPI<null>>({
        mensaje: "Producto eliminado del carrito",
      })
    }

    const producto = await prisma.producto.findUnique({
      where: { id: productoId },
      select: { stock: true },
    })

    if (!producto || producto.stock < cantidad) {
      return NextResponse.json<RespuestaAPI<null>>(
        { error: `Stock insuficiente. Disponible: ${producto?.stock ?? 0}` },
        { status: 409 }
      )
    }

    const item = await prisma.itemCarrito.update({
      where: { carritoId_productoId: { carritoId: carrito.id, productoId } },
      data: { cantidad },
    })

    return NextResponse.json<RespuestaAPI<typeof item>>({
      datos: item,
      mensaje: "Cantidad actualizada",
    })
  } catch (error) {
    console.error("Error al actualizar cantidad:", error)
    return NextResponse.json<RespuestaAPI<null>>(
      { error: "Error al actualizar la cantidad" },
      { status: 500 }
    )
  }
}
