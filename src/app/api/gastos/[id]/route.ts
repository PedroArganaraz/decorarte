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

    if (!user) {
      return NextResponse.json<RespuestaAPI<null>>(
        { error: "No autorizado" },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await solicitud.json() as {
      descripcion?: string
      monto?: number
      categoria?: string
      metodoPago?: string
      notas?: string
      fecha?: string
      insumo?: {
        nombre: string
        precioUnitario: number
        cantidadTotal: number
        unidad: string
      }
    }

    const { descripcion, monto, categoria, metodoPago, notas, fecha, insumo } = body

    if (categoria === "INSUMOS" && insumo) {
      const result = await prisma.$transaction(async (tx) => {
        const gasto = await tx.gasto.update({
          where: { id },
          data: {
            ...(descripcion !== undefined && { descripcion }),
            ...(monto !== undefined && { monto }),
            ...(categoria !== undefined && { categoria: categoria as any }),
            ...(metodoPago !== undefined && { metodoPago: metodoPago as any }),
            ...(notas !== undefined && { notas: notas || null }),
            ...(fecha !== undefined && { fecha: new Date(fecha) }),
          },
        })

        const insumoExistente = await tx.insumo.findFirst({ where: { gastoId: id } })

        if (insumoExistente) {
          const cantidadUsadaEnProductos = Number(insumoExistente.cantidadTotal) - Number(insumoExistente.cantidadDisponible)
          const nuevoCantidadDisponible = Math.max(0, insumo.cantidadTotal - cantidadUsadaEnProductos)
          await tx.insumo.update({
            where: { id: insumoExistente.id },
            data: {
              nombre: insumo.nombre,
              precioUnitario: insumo.precioUnitario,
              cantidadTotal: insumo.cantidadTotal,
              cantidadDisponible: nuevoCantidadDisponible,
              unidad: insumo.unidad,
            },
          })
        } else {
          await tx.insumo.create({
            data: {
              nombre: insumo.nombre,
              precioUnitario: insumo.precioUnitario,
              cantidadTotal: insumo.cantidadTotal,
              cantidadDisponible: insumo.cantidadTotal,
              unidad: insumo.unidad,
              gastoId: id,
            },
          })
        }

        const insumoActualizado = await tx.insumo.findFirst({ where: { gastoId: id } })

        return {
          ...gasto,
          insumo: insumoActualizado
            ? {
                id: insumoActualizado.id,
                precioUnitario: Number(insumoActualizado.precioUnitario),
                cantidadTotal: Number(insumoActualizado.cantidadTotal),
                cantidadDisponible: Number(insumoActualizado.cantidadDisponible),
                unidad: insumoActualizado.unidad,
              }
            : null,
        }
      })

      return NextResponse.json<RespuestaAPI<typeof result>>({
        datos: result,
        mensaje: "Gasto actualizado correctamente",
      })
    }

    const gasto = await prisma.gasto.update({
      where: { id },
      data: {
        ...(descripcion !== undefined && { descripcion }),
        ...(monto !== undefined && { monto }),
        ...(categoria !== undefined && { categoria: categoria as any }),
        ...(metodoPago !== undefined && { metodoPago: metodoPago as any }),
        ...(notas !== undefined && { notas: notas || null }),
        ...(fecha !== undefined && { fecha: new Date(fecha) }),
      },
    })

    return NextResponse.json<RespuestaAPI<typeof gasto & { insumo: null }>>({
      datos: { ...gasto, insumo: null },
      mensaje: "Gasto actualizado correctamente",
    })
  } catch (error) {
    console.error("Error al actualizar gasto:", error)
    return NextResponse.json<RespuestaAPI<null>>(
      { error: "Error al actualizar el gasto" },
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

    const gasto = await prisma.gasto.findUnique({ where: { id } })
    if (!gasto) {
      return NextResponse.json<RespuestaAPI<null>>(
        { error: "Gasto no encontrado" },
        { status: 404 }
      )
    }

    await prisma.gasto.delete({ where: { id } })

    return NextResponse.json<RespuestaAPI<null>>({
      mensaje: "Gasto eliminado correctamente",
    })
  } catch (error) {
    console.error("Error al eliminar gasto:", error)
    return NextResponse.json<RespuestaAPI<null>>(
      { error: "Error al eliminar el gasto" },
      { status: 500 }
    )
  }
}
