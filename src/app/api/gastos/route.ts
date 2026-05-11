import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { crearClienteServidor } from "@/lib/supabase/servidor"
import type { RespuestaAPI } from "@/tipos"

export async function GET(solicitud: NextRequest) {
  try {
    const supabase = await crearClienteServidor()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json<RespuestaAPI<null>>(
        { error: "No autorizado" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(solicitud.url)
    const desde = searchParams.get("desde")
    const hasta = searchParams.get("hasta")
    const categoria = searchParams.get("categoria")

    const gastos = await prisma.gasto.findMany({
      where: {
        ...(desde || hasta ? {
          fecha: {
            ...(desde && { gte: new Date(desde) }),
            ...(hasta && { lte: new Date(hasta) }),
          },
        } : {}),
        ...(categoria && { categoria: categoria as any }),
      },
      include: {
        vendedor: { select: { nombre: true } },
      },
      orderBy: { creadoEn: "desc" },
    })

    return NextResponse.json<RespuestaAPI<typeof gastos>>({ datos: gastos })
  } catch (error) {
    console.error("Error al obtener gastos:", error)
    return NextResponse.json<RespuestaAPI<null>>(
      { error: "Error al obtener los gastos" },
      { status: 500 }
    )
  }
}

export async function POST(solicitud: NextRequest) {
  try {
    const supabase = await crearClienteServidor()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json<RespuestaAPI<null>>(
        { error: "No autorizado" },
        { status: 401 }
      )
    }

    const { descripcion, monto, categoria, metodoPago, notas, fecha } = await solicitud.json() as {
      descripcion: string
      monto: number
      categoria?: string
      metodoPago: string
      notas?: string
      fecha?: string
    }

    if (!descripcion || !monto || !metodoPago) {
      return NextResponse.json<RespuestaAPI<null>>(
        { error: "Faltan campos obligatorios: descripción, monto, método de pago" },
        { status: 400 }
      )
    }

    const gasto = await prisma.gasto.create({
      data: {
        descripcion,
        monto,
        categoria: (categoria as any) || "OTROS",
        metodoPago: metodoPago as any,
        notas: notas || null,
        fecha: fecha ? new Date(fecha) : undefined,
        vendedorId: user.id,
      },
    })

    return NextResponse.json<RespuestaAPI<typeof gasto>>(
      { datos: gasto, mensaje: "Gasto registrado correctamente" },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error al crear gasto:", error)
    return NextResponse.json<RespuestaAPI<null>>(
      { error: "Error al registrar el gasto" },
      { status: 500 }
    )
  }
}
