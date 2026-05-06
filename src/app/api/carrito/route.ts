import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import type { RespuestaAPI } from "@/tipos"

function obtenerSessionId(solicitud: NextRequest): string | null {
  return solicitud.cookies.get("decorarte_session")?.value ?? null
}

export async function GET(solicitud: NextRequest) {
  try {
    const sessionId = obtenerSessionId(solicitud)

    if (!sessionId) {
      return NextResponse.json<RespuestaAPI<null>>({ datos: null })
    }

    const carrito = await prisma.carrito.findUnique({
      where: { sessionId },
      include: {
        items: {
          include: {
            producto: {
              select: {
                id: true,
                nombre: true,
                slug: true,
                precio: true,
                stock: true,
                activo: true,
                imagenes: {
                  where: { esPrincipal: true },
                  select: { urlPublica: true, altText: true },
                  take: 1,
                },
              },
            },
          },
        },
      },
    })

    return NextResponse.json<RespuestaAPI<typeof carrito>>({ datos: carrito })
  } catch (error) {
    console.error("Error al obtener carrito:", error)
    return NextResponse.json<RespuestaAPI<null>>(
      { error: "Error al obtener el carrito" },
      { status: 500 }
    )
  }
}

export async function POST(solicitud: NextRequest) {
  try {
    const sessionId = obtenerSessionId(solicitud)

    if (!sessionId) {
      return NextResponse.json<RespuestaAPI<null>>(
        { error: "Session no encontrada" },
        { status: 400 }
      )
    }

    const { productoId, cantidad } = await solicitud.json()

    if (!productoId || !cantidad || cantidad < 1) {
      return NextResponse.json<RespuestaAPI<null>>(
        { error: "Datos inválidos" },
        { status: 400 }
      )
    }

    const producto = await prisma.producto.findUnique({
      where: { id: productoId, activo: true },
    })

    if (!producto) {
      return NextResponse.json<RespuestaAPI<null>>(
        { error: "Producto no disponible" },
        { status: 404 }
      )
    }

    const carrito = await prisma.carrito.upsert({
      where: { sessionId },
      create: { sessionId },
      update: {},
    })

    const itemExistente = await prisma.itemCarrito.findUnique({
      where: { carritoId_productoId: { carritoId: carrito.id, productoId } },
    })

    let item
    if (itemExistente) {
      const nuevaCantidad = itemExistente.cantidad + cantidad
      item = await prisma.itemCarrito.update({
        where: { id: itemExistente.id },
        data: { cantidad: nuevaCantidad },
      })
    } else {
      item = await prisma.itemCarrito.create({
        data: { carritoId: carrito.id, productoId, cantidad },
      })
    }

    return NextResponse.json<RespuestaAPI<typeof item>>(
      { datos: item, mensaje: "Producto agregado al carrito" },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error al agregar al carrito:", error)
    return NextResponse.json<RespuestaAPI<null>>(
      { error: "Error al agregar al carrito" },
      { status: 500 }
    )
  }
}

export async function DELETE(solicitud: NextRequest) {
  try {
    const sessionId = obtenerSessionId(solicitud)

    if (!sessionId) {
      return NextResponse.json<RespuestaAPI<null>>(
        { error: "Session no encontrada" },
        { status: 400 }
      )
    }

    const { searchParams } = new URL(solicitud.url)
    const productoId = searchParams.get("productoId")

    const carrito = await prisma.carrito.findUnique({ where: { sessionId } })

    if (!carrito) {
      return NextResponse.json<RespuestaAPI<null>>(
        { error: "Carrito no encontrado" },
        { status: 404 }
      )
    }

    if (productoId) {
      await prisma.itemCarrito.deleteMany({
        where: { carritoId: carrito.id, productoId },
      })
      return NextResponse.json<RespuestaAPI<null>>({
        mensaje: "Producto eliminado del carrito",
      })
    }

    await prisma.itemCarrito.deleteMany({ where: { carritoId: carrito.id } })
    return NextResponse.json<RespuestaAPI<null>>({
      mensaje: "Carrito vaciado correctamente",
    })
  } catch (error) {
    console.error("Error al eliminar del carrito:", error)
    return NextResponse.json<RespuestaAPI<null>>(
      { error: "Error al eliminar del carrito" },
      { status: 500 }
    )
  }
}
