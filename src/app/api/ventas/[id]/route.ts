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

export async function PATCH(
  solicitud: NextRequest,
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
    const { cliente, fecha, metodoPago, estado, esRegalo, notas, items, montoRecibido } = await solicitud.json() as {
      cliente?: string
      fecha?: string
      metodoPago?: string
      estado?: string
      esRegalo?: boolean
      notas?: string
      montoRecibido?: number | null
      items: { productoId: string; cantidad: number; precioUnitario: number }[]
    }

    if (!items || items.length === 0) {
      return NextResponse.json<RespuestaAPI<null>>(
        { error: "La venta debe tener al menos un item" },
        { status: 400 }
      )
    }

    const ventaActual = await prisma.venta.findUnique({
      where: { id },
      include: { items: true },
    })
    if (!ventaActual) {
      return NextResponse.json<RespuestaAPI<null>>(
        { error: "Venta no encontrada" },
        { status: 404 }
      )
    }

    // Calcular ajustes de stock: delta > 0 = devolver stock, delta < 0 = descontar
    const antiguosMap = new Map(ventaActual.items.map((i) => [i.productoId, i.cantidad]))
    const nuevosMap = new Map(items.map((i) => [i.productoId, Number(i.cantidad)]))

    const ajustes = new Map<string, number>()
    for (const [productoId, cantAntigua] of antiguosMap) {
      const cantNueva = nuevosMap.get(productoId) ?? 0
      const delta = cantAntigua - cantNueva
      if (delta !== 0) ajustes.set(productoId, delta)
    }
    for (const [productoId, cantNueva] of nuevosMap) {
      if (!antiguosMap.has(productoId)) {
        ajustes.set(productoId, -cantNueva)
      }
    }

    // Obtener datos actuales de los productos nuevos (stock + costo)
    const nuevosIds = [...nuevosMap.keys()]
    const productosNuevos = await prisma.producto.findMany({
      where: { id: { in: nuevosIds } },
      select: { id: true, nombre: true, stock: true, costo: true },
    })

    // Validar stock para los que se descuenta
    for (const [productoId, delta] of ajustes) {
      if (delta >= 0) continue
      const prod = productosNuevos.find((p) => p.id === productoId)
      if (!prod) {
        return NextResponse.json<RespuestaAPI<null>>(
          { error: `Producto no encontrado` },
          { status: 404 }
        )
      }
      if (prod.stock < Math.abs(delta)) {
        return NextResponse.json<RespuestaAPI<null>>(
          { error: `Stock insuficiente para "${prod.nombre}": disponible ${prod.stock}` },
          { status: 409 }
        )
      }
    }

    const costoMap = new Map(productosNuevos.map((p) => [p.id, p.costo]))

    const ventaActualizada = await prisma.$transaction(async (tx) => {
      await tx.venta.update({
        where: { id },
        data: {
          ...(cliente !== undefined && { cliente: cliente || null }),
          ...(fecha !== undefined && { fecha: new Date(fecha) }),
          ...(metodoPago !== undefined && { metodoPago: (metodoPago as any) || null }),
          ...(estado !== undefined && { estado: estado as any }),
          ...(esRegalo !== undefined && { esRegalo }),
          ...(notas !== undefined && { notas: notas || null }),
          ...(montoRecibido !== undefined && { montoRecibido: montoRecibido ?? null }),
        },
      })

      await tx.itemVenta.deleteMany({ where: { ventaId: id } })

      for (const item of items) {
        const cantidad = Number(item.cantidad)
        const precioUnitario = Number(item.precioUnitario)
        const costo = costoMap.get(item.productoId)
        await tx.itemVenta.create({
          data: {
            ventaId: id,
            productoId: item.productoId,
            cantidad,
            precioUnitario,
            precioTotal: precioUnitario * cantidad,
            costoUnitario: costo != null ? Number(costo) : null,
          },
        })
      }

      for (const [productoId, delta] of ajustes) {
        if (delta > 0) {
          await tx.producto.update({
            where: { id: productoId },
            data: { stock: { increment: delta } },
          })
          await tx.movimientoStock.create({
            data: { productoId, tipo: "ENTRADA", cantidad: delta, motivo: "Edición de venta", ventaId: id },
          })
        } else if (delta < 0) {
          await tx.producto.update({
            where: { id: productoId },
            data: { stock: { decrement: Math.abs(delta) } },
          })
          await tx.movimientoStock.create({
            data: { productoId, tipo: "SALIDA", cantidad: Math.abs(delta), motivo: "Edición de venta", ventaId: id },
          })
        }
      }

      return tx.venta.findUnique({
        where: { id },
        include: {
          items: {
            include: {
              producto: { select: { id: true, nombre: true, slug: true } },
            },
          },
        },
      })
    })

    return NextResponse.json<RespuestaAPI<typeof ventaActualizada>>({
      datos: ventaActualizada,
      mensaje: "Venta actualizada correctamente",
    })
  } catch (error) {
    console.error("Error al actualizar venta:", error)
    return NextResponse.json<RespuestaAPI<null>>(
      { error: "Error al actualizar la venta" },
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

      await tx.movimientoCaja.deleteMany({ where: { ventaId: id } })

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
