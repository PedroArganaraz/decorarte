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
    const { descripcion, monto, categoria, metodoPago, notas, fecha } = await solicitud.json() as {
      descripcion?: string
      monto?: number
      categoria?: string
      metodoPago?: string
      notas?: string
      fecha?: string
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

    return NextResponse.json<RespuestaAPI<typeof gasto>>({
      datos: gasto,
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
