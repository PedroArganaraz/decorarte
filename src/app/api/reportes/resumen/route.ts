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

    const filtroPeriodo = desde || hasta
      ? {
          fecha: {
            ...(desde && { gte: new Date(desde) }),
            ...(hasta && { lte: new Date(hasta) }),
          },
        }
      : {}

    const [ventas, gastos, productosSinStock] = await Promise.all([
      prisma.venta.findMany({
        where: filtroPeriodo,
        include: {
          items: {
            include: {
              producto: {
                select: {
                  categoria: { select: { nombre: true } },
                },
              },
            },
          },
        },
      }),
      prisma.gasto.findMany({
        where: filtroPeriodo,
      }),
      prisma.producto.findMany({
        where: { activo: true, stock: 0 },
        select: { id: true, nombre: true, slug: true },
      }),
    ])

    // Ingresos y costos
    let ingresosBrutos = 0
    let costoMercaderia = 0
    let efectivoVentas = 0
    let transferenciaVentas = 0

    const ventasPorCategoria: Record<string, { cantidad: number; total: number }> = {}

    for (const venta of ventas) {
      for (const item of venta.items) {
        ingresosBrutos += item.precioTotal
        costoMercaderia += (item.costoUnitario ?? 0) * item.cantidad

        const catNombre = item.producto.categoria.nombre
        if (!ventasPorCategoria[catNombre]) {
          ventasPorCategoria[catNombre] = { cantidad: 0, total: 0 }
        }
        ventasPorCategoria[catNombre].cantidad += item.cantidad
        ventasPorCategoria[catNombre].total += item.precioTotal
      }

      if (venta.metodoPago === "EFECTIVO") {
        efectivoVentas += ventas
          .filter((v) => v.id === venta.id)
          .flatMap((v) => v.items)
          .reduce((s, i) => s + i.precioTotal, 0)
      } else if (venta.metodoPago === "TRANSFERENCIA") {
        transferenciaVentas += ventas
          .filter((v) => v.id === venta.id)
          .flatMap((v) => v.items)
          .reduce((s, i) => s + i.precioTotal, 0)
      }
    }

    // Gastos
    let totalGastos = 0
    let efectivoGastos = 0
    let transferenciaGastos = 0

    for (const gasto of gastos) {
      totalGastos += gasto.monto
      if (gasto.metodoPago === "EFECTIVO") efectivoGastos += gasto.monto
      else if (gasto.metodoPago === "TRANSFERENCIA") transferenciaGastos += gasto.monto
    }

    const gananciaProductos = ingresosBrutos - costoMercaderia
    const gananciaNeta = gananciaProductos - totalGastos

    const resumen = {
      periodo: { desde: desde ?? null, hasta: hasta ?? null },
      ventas: {
        cantidad: ventas.length,
        ingresosBrutos: Math.round(ingresosBrutos * 100) / 100,
        costoMercaderia: Math.round(costoMercaderia * 100) / 100,
        gananciaProductos: Math.round(gananciaProductos * 100) / 100,
        desglosePago: {
          efectivo: Math.round(efectivoVentas * 100) / 100,
          transferencia: Math.round(transferenciaVentas * 100) / 100,
          sinMetodo: Math.round((ingresosBrutos - efectivoVentas - transferenciaVentas) * 100) / 100,
        },
        porCategoria: Object.entries(ventasPorCategoria).map(([nombre, datos]) => ({
          categoria: nombre,
          cantidad: datos.cantidad,
          total: Math.round(datos.total * 100) / 100,
        })),
      },
      gastos: {
        cantidad: gastos.length,
        total: Math.round(totalGastos * 100) / 100,
        desglosePago: {
          efectivo: Math.round(efectivoGastos * 100) / 100,
          transferencia: Math.round(transferenciaGastos * 100) / 100,
        },
      },
      gananciaNeta: Math.round(gananciaNeta * 100) / 100,
      productosSinStock: productosSinStock,
    }

    return NextResponse.json<RespuestaAPI<typeof resumen>>({ datos: resumen })
  } catch (error) {
    console.error("Error al generar resumen:", error)
    return NextResponse.json<RespuestaAPI<null>>(
      { error: "Error al generar el resumen" },
      { status: 500 }
    )
  }
}
