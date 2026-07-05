import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { crearClienteServidor } from "@/lib/supabase/servidor"
import type { RespuestaAPI } from "@/tipos"

export async function GET() {
  try {
    const supabase = await crearClienteServidor()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json<RespuestaAPI<null>>({ error: "No autorizado" }, { status: 401 })

    const insumos = await prisma.insumo.findMany({
      orderBy: { nombre: "asc" },
      include: {
        gasto: { select: { id: true, descripcion: true } },
      },
    })

    return NextResponse.json<RespuestaAPI<typeof insumos>>({ datos: insumos })
  } catch (error) {
    console.error("Error al obtener insumos:", error)
    return NextResponse.json<RespuestaAPI<null>>({ error: "Error al obtener insumos" }, { status: 500 })
  }
}

export async function POST(solicitud: NextRequest) {
  try {
    const supabase = await crearClienteServidor()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json<RespuestaAPI<null>>({ error: "No autorizado" }, { status: 401 })

    const { nombre, precioUnitario, cantidadTotal, unidad, gastoId } = await solicitud.json() as {
      nombre: string
      precioUnitario: number
      cantidadTotal: number
      unidad: string
      gastoId?: string
    }

    if (!nombre || precioUnitario == null || cantidadTotal == null) {
      return NextResponse.json<RespuestaAPI<null>>({ error: "Faltan campos obligatorios" }, { status: 400 })
    }

    const insumo = await prisma.insumo.create({
      data: {
        nombre,
        precioUnitario,
        cantidadTotal,
        cantidadDisponible: cantidadTotal,
        unidad: unidad || "unidad",
        gastoId: gastoId || null,
      },
      include: {
        gasto: { select: { id: true, descripcion: true } },
      },
    })

    return NextResponse.json<RespuestaAPI<typeof insumo>>({ datos: insumo }, { status: 201 })
  } catch (error) {
    console.error("Error al crear insumo:", error)
    return NextResponse.json<RespuestaAPI<null>>({ error: "Error al crear insumo" }, { status: 500 })
  }
}
