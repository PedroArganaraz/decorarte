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

    const [ventas, gastos, productosSinStock, productosConStock, movimientosCaja] = await Promise.all([
      prisma.venta.findMany({
        where: { ...filtroPeriodo, estado: { in: ["PAGADO", "PAGADO_Y_ENTREGADO"] } },
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
      prisma.movimientoCaja.findMany({
        where: filtroPeriodo,
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

      const totalVenta = venta.items.reduce((s, i) => s + i.precioTotal, 0)
      if (venta.metodoPago === "EFECTIVO") {
        efectivoVentas += venta.montoRecibido != null ? Number(venta.montoRecibido) : totalVenta
      } else if (venta.metodoPago === "TRANSFERENCIA") {
        transferenciaVentas += totalVenta
      }
    }

    // Gastos — separados entre operativos y retiros de capital
    let totalGastosOperativos = 0
    let totalRetiros = 0
    let efectivoGastos = 0
    let transferenciaGastos = 0
    const gastosPorCategoria: Record<string, number> = {}

    for (const gasto of gastos) {
      if (gasto.categoria === "RETIRO") {
        totalRetiros += gasto.monto
      } else {
        totalGastosOperativos += gasto.monto
        if (gasto.metodoPago === "EFECTIVO") efectivoGastos += gasto.monto
        else if (gasto.metodoPago === "TRANSFERENCIA") transferenciaGastos += gasto.monto
        gastosPorCategoria[gasto.categoria] = (gastosPorCategoria[gasto.categoria] ?? 0) + gasto.monto
      }
    }

    // Movimientos de caja — ajustes sobre balances de efectivo y transferencia
    let ajusteEfectivo = 0
    let ajusteTransferencia = 0
    let vueltos = 0
    let efATransTotal = 0
    let transAEfTotal = 0
    let ingresoEfectivo = 0
    let ingresoTransferencia = 0

    for (const mov of movimientosCaja) {
      const monto = Number(mov.monto)
      if (mov.tipo === "VUELTO") {
        vueltos += monto
        if (mov.metodoPago === "TRANSFERENCIA") {
          ajusteTransferencia -= monto
        } else if (mov.metodoPago === "EFECTIVO") {
          ajusteEfectivo -= monto
        }
        // metodoPago null → sin ajuste (datos sin método registrado)
      } else if (mov.tipo === "EF_A_TRANS") {
        ajusteEfectivo -= monto
        ajusteTransferencia += monto
        efATransTotal += monto
      } else if (mov.tipo === "TRANS_A_EF") {
        ajusteTransferencia -= monto
        ajusteEfectivo += monto
        transAEfTotal += monto
      } else if (mov.tipo === "INGRESO") {
        if (mov.metodoPago === "EFECTIVO") ingresoEfectivo += monto
        else if (mov.metodoPago === "TRANSFERENCIA") ingresoTransferencia += monto
      }
    }

    efectivoVentas += ajusteEfectivo
    transferenciaVentas += ajusteTransferencia

    const saldoEfectivo = efectivoVentas + ingresoEfectivo - efectivoGastos
    const saldoTransferencia = transferenciaVentas + ingresoTransferencia - transferenciaGastos

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
    const gananciaNeta = gananciaProductos - totalGastosOperativos

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
        },
        porCategoria: Object.entries(ventasPorCategoria).map(([nombre, datos]) => ({
          categoria: nombre,
          cantidad: datos.cantidad,
          total: Math.round(datos.total * 100) / 100,
        })),
      },
      gastos: {
        cantidad: gastos.filter((g) => g.categoria !== "RETIRO").length,
        total: Math.round(totalGastosOperativos * 100) / 100,
        retiros: Math.round(totalRetiros * 100) / 100,
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
      saldoEfectivo: Math.round(saldoEfectivo * 100) / 100,
      saldoTransferencia: Math.round(saldoTransferencia * 100) / 100,
      movimientos: {
        total: movimientosCaja.length,
        vueltos: Math.round(vueltos * 100) / 100,
        efATransTotal: Math.round(efATransTotal * 100) / 100,
        transAEfTotal: Math.round(transAEfTotal * 100) / 100,
      },
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
