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

    const { id } = await params
    const { tipo, descripcion, monto, fecha, metodoPago } = await solicitud.json() as {
      tipo?: string
      descripcion?: string
      monto?: number
      fecha?: string
      metodoPago?: string
    }

    const movimiento = await prisma.movimientoCaja.update({
      where: { id },
      data: {
        ...(tipo && { tipo }),
        ...(descripcion !== undefined && { descripcion: descripcion || null }),
        ...(monto !== undefined && { monto }),
        ...(fecha && { fecha: new Date(fecha) }),
        ...(metodoPago !== undefined && { metodoPago: metodoPago || null }),
      },
    })

    return NextResponse.json<RespuestaAPI<typeof movimiento>>({ datos: movimiento })
  } catch (error) {
    console.error("Error al actualizar movimiento de caja:", error)
    return NextResponse.json<RespuestaAPI<null>>({ error: "Error al actualizar movimiento" }, { status: 500 })
  }
}

export async function DELETE(
  solicitud: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await crearClienteServidor()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json<RespuestaAPI<null>>({ error: "No autorizado" }, { status: 401 })

    const { id } = await params
    await prisma.movimientoCaja.delete({ where: { id } })

    return NextResponse.json<RespuestaAPI<null>>({ datos: null, mensaje: "Movimiento eliminado" })
  } catch (error) {
    console.error("Error al eliminar movimiento de caja:", error)
    return NextResponse.json<RespuestaAPI<null>>({ error: "Error al eliminar movimiento" }, { status: 500 })
  }
}
