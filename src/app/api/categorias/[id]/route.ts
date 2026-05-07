import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { crearClienteServidor } from "@/lib/supabase/servidor"
import slugify from "slugify"
import type { RespuestaAPI } from "@/tipos"
import type { Prisma } from "@prisma/client"
type Categoria = Prisma.CategoriaGetPayload<{}>

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
    const { nombre, descripcion, orden, activa } = await solicitud.json()

    const slug = nombre
      ? slugify(nombre, { lower: true, strict: true, locale: "es" })
      : undefined

    const categoria = await prisma.categoria.update({
      where: { id },
      data: {
        ...(nombre && { nombre }),
        ...(slug && { slug }),
        ...(descripcion !== undefined && { descripcion }),
        ...(orden !== undefined && { orden }),
        ...(activa !== undefined && { activa }),
      },
    })

    return NextResponse.json<RespuestaAPI<Categoria>>({
      datos: categoria,
      mensaje: "Categoría actualizada correctamente",
    })
  } catch (error) {
    console.error("Error al actualizar categoría:", error)
    return NextResponse.json<RespuestaAPI<null>>(
      { error: "Error al actualizar la categoría" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _solicitud: NextRequest,
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

    const productosEnCategoria = await prisma.producto.count({
      where: { categoriaId: id },
    })

    if (productosEnCategoria > 0) {
      return NextResponse.json<RespuestaAPI<null>>(
        { error: "No se puede eliminar una categoría con productos asociados" },
        { status: 409 }
      )
    }

    await prisma.categoria.delete({ where: { id } })

    return NextResponse.json<RespuestaAPI<null>>({
      mensaje: "Categoría eliminada correctamente",
    })
  } catch (error) {
    console.error("Error al eliminar categoría:", error)
    return NextResponse.json<RespuestaAPI<null>>(
      { error: "Error al eliminar la categoría" },
      { status: 500 }
    )
  }
}
