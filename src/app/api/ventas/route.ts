import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
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
    const cliente = searchParams.get("cliente")
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1)
    const limit = Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10) || 20)
    const skip = (page - 1) * limit

    const where: Prisma.VentaWhereInput = {
      ...(desde || hasta ? {
        fecha: {
          ...(desde && { gte: new Date(desde) }),
          ...(hasta && { lte: new Date(hasta) }),
        },
      } : {}),
      ...(cliente && { cliente: { contains: cliente, mode: Prisma.QueryMode.insensitive } }),
    }

    const [ventas, total, sumaTotal, sumaEfectivo, sumaTransferencia] = await Promise.all([
      prisma.venta.findMany({
        where,
        skip,
        take: limit,
        include: {
          items: {
            include: {
              producto: { select: { id: true, nombre: true, slug: true } },
            },
          },
          vendedor: { select: { nombre: true } },
        },
        orderBy: { fecha: "desc" },
      }),
      prisma.venta.count({ where }),
      prisma.itemVenta.aggregate({ _sum: { precioTotal: true }, where: { venta: where } }),
      prisma.itemVenta.aggregate({ _sum: { precioTotal: true }, where: { venta: { ...where, metodoPago: "EFECTIVO" } } }),
      prisma.itemVenta.aggregate({ _sum: { precioTotal: true }, where: { venta: { ...where, metodoPago: "TRANSFERENCIA" } } }),
    ])

    const totalPaginas = Math.max(1, Math.ceil(total / limit))

    return NextResponse.json({
      datos: ventas,
      total,
      pagina: page,
      totalPaginas,
      metricas: {
        totalPeriodo: Number(sumaTotal._sum.precioTotal ?? 0),
        totalEfectivo: Number(sumaEfectivo._sum.precioTotal ?? 0),
        totalTransferencia: Number(sumaTransferencia._sum.precioTotal ?? 0),
      },
    })
  } catch (error) {
    console.error("Error al obtener ventas:", error)
    return NextResponse.json<RespuestaAPI<null>>(
      { error: "Error al obtener las ventas" },
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

    const { cliente, metodoPago, estado, esRegalo, notas, items, montoRecibido } = await solicitud.json() as {
      cliente?: string
      metodoPago?: string
      estado?: string
      esRegalo?: boolean
      notas?: string
      montoRecibido?: number
      items: { productoId: string; cantidad: number; precioUnitario: number }[]
    }

    if (!items || items.length === 0) {
      return NextResponse.json<RespuestaAPI<null>>(
        { error: "La venta debe tener al menos un item" },
        { status: 400 }
      )
    }

    // Validar stock de todos los productos
    const productoIds = items.map((i) => i.productoId)
    const productos = await prisma.producto.findMany({
      where: { id: { in: productoIds } },
      select: { id: true, nombre: true, stock: true, costo: true },
    })

    for (const item of items) {
      const prod = productos.find((p) => p.id === item.productoId)
      if (!prod) {
        return NextResponse.json<RespuestaAPI<null>>(
          { error: `Producto ${item.productoId} no encontrado` },
          { status: 404 }
        )
      }
      if (prod.stock < item.cantidad) {
        return NextResponse.json<RespuestaAPI<null>>(
          { error: `Stock insuficiente para "${prod.nombre}": disponible ${prod.stock}, solicitado ${item.cantidad}` },
          { status: 409 }
        )
      }
    }

    // Transacción atómica: crear venta + descontar stock + registrar movimientos
    const venta = await prisma.$transaction(async (tx) => {
      const ventaCreada = await tx.venta.create({
        data: {
          cliente: cliente || null,
          metodoPago: (metodoPago as any) || null,
          estado: (estado as any) || "PAGADO_Y_ENTREGADO",
          esRegalo: esRegalo ?? false,
          notas: notas || null,
          montoRecibido: montoRecibido ?? null,
          vendedorId: user.id,
          items: {
            create: items.map((item) => {
              const prod = productos.find((p) => p.id === item.productoId)!
              const precioUnitario = Number(item.precioUnitario)
              const cantidad = Number(item.cantidad)
              return {
                productoId: item.productoId,
                cantidad,
                precioUnitario,
                precioTotal: precioUnitario * cantidad,
                costoUnitario: prod.costo != null ? Number(prod.costo) : null,
              }
            }),
          },
        },
        include: {
          items: {
            include: {
              producto: { select: { id: true, nombre: true, slug: true } },
            },
          },
        },
      })

      // Descontar stock y registrar movimientos
      for (const item of items) {
        await tx.producto.update({
          where: { id: item.productoId },
          data: { stock: { decrement: item.cantidad } },
        })

        await tx.movimientoStock.create({
          data: {
            productoId: item.productoId,
            tipo: "SALIDA",
            cantidad: item.cantidad,
            motivo: "Venta",
            ventaId: ventaCreada.id,
          },
        })
      }

      return ventaCreada
    })

    return NextResponse.json<RespuestaAPI<typeof venta>>(
      { datos: venta, mensaje: "Venta registrada correctamente" },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error al crear venta:", error)
    return NextResponse.json<RespuestaAPI<null>>(
      { error: "Error al registrar la venta" },
      { status: 500 }
    )
  }
}
