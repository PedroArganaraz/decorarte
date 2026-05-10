import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { crearClienteServidor } from "@/lib/supabase/servidor"
import type { RespuestaAPI } from "@/tipos"

export async function GET(
  _solicitud: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params

    const venta = await prisma.venta.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            producto: {
              select: {
                id: true,
                nombre: true,
                slug: true,
                imagenes: {
                  where: { esPrincipal: true },
                  select: { urlPublica: true, altText: true },
                  take: 1,
                },
              },
            },
          },
        },
        vendedor: { select: { nombre: true, email: true } },
      },
    })

    if (!venta) {
      return NextResponse.json<RespuestaAPI<null>>(
        { error: "Venta no encontrada" },
        { status: 404 }
      )
    }

    return NextResponse.json<RespuestaAPI<typeof venta>>({ datos: venta })
  } catch (error) {
    console.error("Error al obtener venta:", error)
    return NextResponse.json<RespuestaAPI<null>>(
      { error: "Error al obtener la venta" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _solicitud: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params

    const venta = await prisma.venta.findUnique({
      where: { id },
      include: { items: true },
    })

    if (!venta) {
      return NextResponse.json<RespuestaAPI<null>>(
        { error: "Venta no encontrada" },
        { status: 404 }
      )
    }

    // Restaurar stock y registrar movimientos de entrada en transacción
    await prisma.$transaction(async (tx) => {
      for (const item of venta.items) {
        await tx.producto.update({
          where: { id: item.productoId },
          data: { stock: { increment: item.cantidad } },
        })

        await tx.movimientoStock.create({
          data: {
            productoId: item.productoId,
            tipo: "ENTRADA",
            cantidad: item.cantidad,
            motivo: "Anulación de venta",
            ventaId: id,
          },
        })
      }

      await tx.venta.delete({ where: { id } })
    })

    return NextResponse.json<RespuestaAPI<null>>({
      mensaje: "Venta anulada y stock restaurado correctamente",
    })
  } catch (error) {
    console.error("Error al anular venta:", error)
    return NextResponse.json<RespuestaAPI<null>>(
      { error: "Error al anular la venta" },
      { status: 500 }
    )
  }
}
