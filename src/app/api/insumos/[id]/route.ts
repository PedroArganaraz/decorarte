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
    if (!user) return NextResponse.json<RespuestaAPI<null>>({ error: "No autorizado" }, { status: 401 })

    const { id } = await params
    const insumo = await prisma.insumo.findUnique({
      where: { id: parseInt(id) },
      include: { gasto: { select: { id: true, descripcion: true } } },
    })
    if (!insumo) return NextResponse.json<RespuestaAPI<null>>({ error: "Insumo no encontrado" }, { status: 404 })

    return NextResponse.json<RespuestaAPI<typeof insumo>>({ datos: insumo })
  } catch (error) {
    console.error("Error al obtener insumo:", error)
    return NextResponse.json<RespuestaAPI<null>>({ error: "Error al obtener insumo" }, { status: 500 })
  }
}

export async function PUT(
  solicitud: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await crearClienteServidor()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json<RespuestaAPI<null>>({ error: "No autorizado" }, { status: 401 })

    const { id } = await params
    const idNum = parseInt(id)
    const { nombre, precioUnitario, cantidadTotal, unidad, gastoId } = await solicitud.json() as {
      nombre: string
      precioUnitario: number
      cantidadTotal: number
      unidad: string
      gastoId?: string
    }

    // Calcular cantidadUsada total en productos para ajustar cantidadDisponible
    const usada = await prisma.insumoProducto.aggregate({
      where: { insumoId: idNum },
      _sum: { cantidadUsada: true },
    })
    const totalUsado = usada._sum.cantidadUsada ?? 0
    const cantidadDisponible = Math.max(0, cantidadTotal - totalUsado)

    const insumo = await prisma.insumo.update({
      where: { id: idNum },
      data: {
        nombre,
        precioUnitario,
        cantidadTotal,
        cantidadDisponible,
        unidad: unidad || "unidad",
        gastoId: gastoId || null,
      },
      include: { gasto: { select: { id: true, descripcion: true } } },
    })

    return NextResponse.json<RespuestaAPI<typeof insumo>>({ datos: insumo })
  } catch (error) {
    console.error("Error al actualizar insumo:", error)
    return NextResponse.json<RespuestaAPI<null>>({ error: "Error al actualizar insumo" }, { status: 500 })
  }
}

export async function DELETE(
  _solicitud: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await crearClienteServidor()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json<RespuestaAPI<null>>({ error: "No autorizado" }, { status: 401 })

    const { id } = await params
    const idNum = parseInt(id)
    const insumo = await prisma.insumo.findUnique({ where: { id: idNum } })
    if (!insumo) return NextResponse.json<RespuestaAPI<null>>({ error: "Insumo no encontrado" }, { status: 404 })

    if (insumo.cantidadDisponible !== insumo.cantidadTotal) {
      return NextResponse.json<RespuestaAPI<null>>(
        { error: "No se puede eliminar: el insumo está siendo usado en productos" },
        { status: 409 }
      )
    }

    await prisma.insumo.delete({ where: { id: idNum } })
    return NextResponse.json<RespuestaAPI<null>>({ datos: null, mensaje: "Insumo eliminado" })
  } catch (error) {
    console.error("Error al eliminar insumo:", error)
    return NextResponse.json<RespuestaAPI<null>>({ error: "Error al eliminar insumo" }, { status: 500 })
  }
}
