import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { crearClienteServidor } from "@/lib/supabase/servidor"
import type { RespuestaAPI } from "@/tipos"

// GET - obtener productos combinados de un producto
export async function GET(
  _solicitud: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const producto = await prisma.producto.findUnique({
      where: { id },
      select: {
        combinadoCon: {
          select: {
            id: true,
            nombre: true,
            slug: true,
            precio: true,
            precioAnterior: true,
            activo: true,
            destacado: true,
            stock: true,
            imagenes: {
              where: { esPrincipal: true },
              select: { urlPublica: true, altText: true, esPrincipal: true },
              take: 1,
            },
            categoria: { select: { nombre: true, slug: true } },
          },
        },
      },
    })

    return NextResponse.json<RespuestaAPI<typeof producto>>({ datos: producto })
  } catch (error) {
    console.error("Error al obtener combinados:", error)
    return NextResponse.json<RespuestaAPI<null>>(
      { error: "Error al obtener los productos combinados" },
      { status: 500 }
    )
  }
}

// PUT - actualizar lista de productos combinados
export async function PUT(
  solicitud: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await crearClienteServidor()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json<RespuestaAPI<null>>(
        { error: "No autorizado" },
        { status: 401 }
      )
    }

    const { id } = await params
    const { productoIds } = await solicitud.json()

    // El panel solo muestra combinados activos: los vínculos con productos
    // inactivos no se ven en pantalla, así que se conservan tal cual.
    const actual = await prisma.producto.findUnique({
      where: { id },
      select: { combinadoCon: { where: { activo: false }, select: { id: true } } },
    })
    const idsInactivos = actual?.combinadoCon.map((p) => p.id) ?? []
    const idsFinales = [...new Set<string>([...(productoIds as string[]), ...idsInactivos])]

    const producto = await prisma.producto.update({
      where: { id },
      data: {
        combinadoCon: {
          set: idsFinales.map((pid) => ({ id: pid })),
        },
      },
      select: {
        combinadoCon: {
          where: { activo: true },
          select: {
            id: true,
            nombre: true,
            slug: true,
          },
        },
      },
    })

    return NextResponse.json<RespuestaAPI<typeof producto>>({
      datos: producto,
      mensaje: "Productos combinados actualizados",
    })
  } catch (error) {
    console.error("Error al actualizar combinados:", error)
    return NextResponse.json<RespuestaAPI<null>>(
      { error: "Error al actualizar los productos combinados" },
      { status: 500 }
    )
  }
}
