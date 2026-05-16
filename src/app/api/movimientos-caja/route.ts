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
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1)
    const limit = Math.max(1, parseInt(searchParams.get("limit") ?? "10", 10) || 10)
    const skip = (page - 1) * limit

    const where = {
      ...(ventaId && { ventaId }),
      ...(desde || hasta ? {
        fecha: {
          ...(desde && { gte: new Date(desde) }),
          ...(hasta && { lte: new Date(hasta) }),
        },
      } : {}),
    }

    const [movimientos, total] = await Promise.all([
      prisma.movimientoCaja.findMany({ where, skip, take: limit, orderBy: { creadoEn: "desc" } }),
      prisma.movimientoCaja.count({ where }),
    ])

    const totalPaginas = Math.max(1, Math.ceil(total / limit))

    return NextResponse.json({ datos: movimientos, total, pagina: page, totalPaginas })
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
