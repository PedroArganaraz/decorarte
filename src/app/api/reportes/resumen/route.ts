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

    const [ventas, gastos, productosSinStock, productosConStock] = await Promise.all([
      prisma.venta.findMany({
        where: filtroPeriodo,
        include: {
          items: {
            include: {
              producto: {
                select: {
                  id: true,
                  nombre: true,
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
      prisma.producto.findMany({
        where: { activo: true, stock: { gt: 0 }, costo: { not: null } },
        select: {
          stock: true,
          costo: true,
          categoria: { select: { nombre: true } },
        },
      }),
    ])

    // Ingresos y costos
    let ingresosBrutos = 0
    let costoMercaderia = 0
    let efectivoVentas = 0
    let transferenciaVentas = 0

    const ventasPorCategoria: Record<string, { cantidad: number; total: number }> = {}
    const productoMap: Record<string, { nombre: string; categoria: string; unidades: number; montoTotal: number }> = {}

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

        const prodId = item.productoId
        if (!productoMap[prodId]) {
          productoMap[prodId] = { nombre: item.producto.nombre, categoria: catNombre, unidades: 0, montoTotal: 0 }
        }
        productoMap[prodId].unidades += item.cantidad
        productoMap[prodId].montoTotal += item.precioTotal
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
    const gastosPorCategoria: Record<string, number> = {}

    for (const gasto of gastos) {
      totalGastos += gasto.monto
      if (gasto.metodoPago === "EFECTIVO") efectivoGastos += gasto.monto
      else if (gasto.metodoPago === "TRANSFERENCIA") transferenciaGastos += gasto.monto
      gastosPorCategoria[gasto.categoria] = (gastosPorCategoria[gasto.categoria] ?? 0) + gasto.monto
    }

    // Combinaciones frecuentes (pares de productos comprados en la misma venta)
    const parMap: Record<string, {
      prod1: { id: string; nombre: string }
      prod2: { id: string; nombre: string }
      veces: number
    }> = {}

    for (const venta of ventas) {
      if (venta.items.length < 2) continue
      for (let i = 0; i < venta.items.length; i++) {
        for (let j = i + 1; j < venta.items.length; j++) {
          const a = venta.items[i]
          const b = venta.items[j]
          const [first, second] = a.productoId < b.productoId ? [a, b] : [b, a]
          const key = `${first.productoId}|${second.productoId}`
          if (!parMap[key]) {
            parMap[key] = {
              prod1: { id: first.productoId, nombre: first.producto.nombre },
              prod2: { id: second.productoId, nombre: second.producto.nombre },
              veces: 0,
            }
          }
          parMap[key].veces++
        }
      }
    }

    const combinacionesFrecuentes = Object.values(parMap)
      .sort((a, b) => b.veces - a.veces)
      .slice(0, 20)
      .map(({ prod1, prod2, veces }) => ({ producto1: prod1, producto2: prod2, veces }))

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
        porCategoria: Object.entries(gastosPorCategoria).map(([categoria, total]) => ({
          categoria,
          total: Math.round(total * 100) / 100,
        })),
      },
      gananciaNeta: Math.round(gananciaNeta * 100) / 100,
      productosSinStock: productosSinStock,
      inventario: (() => {
        const porCat: Record<string, { unidades: number; capital: number }> = {}
        let totalCapital = 0
        for (const p of productosConStock) {
          const capital = p.stock * Number(p.costo)
          totalCapital += capital
          const cat = p.categoria.nombre
          if (!porCat[cat]) porCat[cat] = { unidades: 0, capital: 0 }
          porCat[cat].unidades += p.stock
          porCat[cat].capital += capital
        }
        return {
          totalCapital: Math.round(totalCapital * 100) / 100,
          porCategoria: Object.entries(porCat)
            .map(([categoria, d]) => ({
              categoria,
              unidades: d.unidades,
              totalCapital: Math.round(d.capital * 100) / 100,
            }))
            .sort((a, b) => b.totalCapital - a.totalCapital),
        }
      })(),
      combinacionesFrecuentes,
      topProductos: Object.entries(productoMap)
        .map(([productoId, d]) => ({
          productoId,
          nombre: d.nombre,
          categoria: d.categoria,
          unidades: d.unidades,
          montoTotal: Math.round(d.montoTotal * 100) / 100,
        }))
        .sort((a, b) => b.unidades - a.unidades)
        .slice(0, 10),
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
