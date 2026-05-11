import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { crearClienteServidor } from "@/lib/supabase/servidor"
import type { RespuestaAPI } from "@/tipos"

export async function GET(solicitud: NextRequest) {
  try {
    const supabase = await crearClienteServidor()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json<RespuestaAPI<null>>({ error: "No autorizado" }, { status: 401 })

    const { searchParams } = new URL(solicitud.url)
    const desde = searchParams.get("desde")
    const hasta = searchParams.get("hasta")
    const ventaId = searchParams.get("ventaId")

    const movimientos = await prisma.movimientoCaja.findMany({
      where: {
        ...(ventaId && { ventaId }),
        ...(desde || hasta ? {
          fecha: {
            ...(desde && { gte: new Date(desde) }),
            ...(hasta && { lte: new Date(hasta) }),
          },
        } : {}),
      },
      orderBy: { creadoEn: "desc" },
    })

    return NextResponse.json<RespuestaAPI<typeof movimientos>>({ datos: movimientos })
  } catch (error) {
    console.error("Error al obtener movimientos de caja:", error)
    return NextResponse.json<RespuestaAPI<null>>({ error: "Error al obtener movimientos" }, { status: 500 })
  }
}

export async function POST(solicitud: NextRequest) {
  try {
    const supabase = await crearClienteServidor()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json<RespuestaAPI<null>>({ error: "No autorizado" }, { status: 401 })

    const { tipo, descripcion, monto, ventaId, fecha, metodoPago } = await solicitud.json() as {
      tipo: string
      descripcion?: string
      monto: number
      ventaId?: string
      fecha?: string
      metodoPago?: string
    }

    if (!tipo || !monto) {
      return NextResponse.json<RespuestaAPI<null>>({ error: "Faltan campos obligatorios" }, { status: 400 })
    }

    const movimiento = await prisma.movimientoCaja.create({
      data: {
        tipo,
        descripcion: descripcion || null,
        monto,
        ventaId: ventaId || null,
        fecha: fecha ? new Date(fecha) : undefined,
        metodoPago: metodoPago || null,
      },
    })

    return NextResponse.json<RespuestaAPI<typeof movimiento>>({ datos: movimiento }, { status: 201 })
  } catch (error) {
    console.error("Error al crear movimiento de caja:", error)
    return NextResponse.json<RespuestaAPI<null>>({ error: "Error al crear movimiento" }, { status: 500 })
  }
}
