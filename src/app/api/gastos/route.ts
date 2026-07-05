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
        insumos: {
          select: {
            id: true,
            precioUnitario: true,
            cantidadTotal: true,
            cantidadDisponible: true,
            unidad: true,
          },
        },
      },
      orderBy: { creadoEn: "desc" },
    })

    const datos = gastos.map(({ insumos, ...g }) => ({
      ...g,
      insumo: insumos[0]
        ? {
            id: insumos[0].id,
            precioUnitario: Number(insumos[0].precioUnitario),
            cantidadTotal: Number(insumos[0].cantidadTotal),
            cantidadDisponible: Number(insumos[0].cantidadDisponible),
            unidad: insumos[0].unidad,
          }
        : null,
    }))

    return NextResponse.json<RespuestaAPI<typeof datos>>({ datos })
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

    const body = await solicitud.json() as {
      descripcion: string
      monto: number
      categoria?: string
      metodoPago: string
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

    if (!descripcion || !monto || !metodoPago) {
      return NextResponse.json<RespuestaAPI<null>>(
        { error: "Faltan campos obligatorios: descripción, monto, método de pago" },
        { status: 400 }
      )
    }

    if (categoria === "INSUMOS" && insumo) {
      const result = await prisma.$transaction(async (tx) => {
        const gasto = await tx.gasto.create({
          data: {
            descripcion,
            monto,
            categoria: "INSUMOS",
            metodoPago: metodoPago as any,
            notas: notas || null,
            fecha: fecha ? new Date(fecha) : undefined,
            vendedorId: user.id,
          },
        })

        const nuevoInsumo = await tx.insumo.create({
          data: {
            nombre: insumo.nombre,
            precioUnitario: insumo.precioUnitario,
            cantidadTotal: insumo.cantidadTotal,
            cantidadDisponible: insumo.cantidadTotal,
            unidad: insumo.unidad,
            gastoId: gasto.id,
          },
        })

        return {
          ...gasto,
          insumo: {
            id: nuevoInsumo.id,
            precioUnitario: Number(nuevoInsumo.precioUnitario),
            cantidadTotal: Number(nuevoInsumo.cantidadTotal),
            cantidadDisponible: Number(nuevoInsumo.cantidadDisponible),
            unidad: nuevoInsumo.unidad,
          },
        }
      })

      return NextResponse.json<RespuestaAPI<typeof result>>(
        { datos: result, mensaje: "Gasto registrado correctamente" },
        { status: 201 }
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

    return NextResponse.json<RespuestaAPI<typeof gasto & { insumo: null }>>(
      { datos: { ...gasto, insumo: null }, mensaje: "Gasto registrado correctamente" },
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
