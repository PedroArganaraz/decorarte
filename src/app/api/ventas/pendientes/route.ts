import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { crearClienteServidor } from "@/lib/supabase/servidor"
import type { RespuestaAPI } from "@/tipos"

export async function GET() {
  try {
    const supabase = await crearClienteServidor()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json<RespuestaAPI<null>>(
        { error: "No autorizado" },
        { status: 401 }
      )
    }

    const ventas = await prisma.venta.findMany({
      where: { estado: { in: ["PENDIENTE", "PAGO_PARCIAL"] } },
      include: {
        items: {
          include: {
            producto: { select: { nombre: true } },
          },
        },
      },
      orderBy: { fecha: "desc" },
    })

    const datos = ventas.map((v) => ({
      id: v.id,
      fecha: v.fecha.toISOString(),
      cliente: v.cliente,
      estado: v.estado,
      metodoPago: v.metodoPago,
      montoRecibido: v.montoRecibido != null ? Number(v.montoRecibido) : null,
      total: v.items.reduce((s, i) => s + Number(i.precioTotal), 0),
      items: v.items.map((i) => ({ nombre: i.producto.nombre, cantidad: i.cantidad })),
    }))

    return NextResponse.json<RespuestaAPI<typeof datos>>({ datos })
  } catch (error) {
    console.error("Error al obtener cobros pendientes:", error)
    return NextResponse.json<RespuestaAPI<null>>(
      { error: "Error al obtener cobros pendientes" },
      { status: 500 }
    )
  }
}
