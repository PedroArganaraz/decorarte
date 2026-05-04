import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { crearClienteServidor } from "@/lib/supabase/servidor"
import slugify from "slugify"
import type { RespuestaAPI } from "@/tipos"
import type { Categoria } from "@prisma/client"

export async function GET() {
  try {
    const categorias = await prisma.categoria.findMany({
      where: { activa: true },
      orderBy: { orden: "asc" },
    })
    return NextResponse.json<RespuestaAPI<Categoria[]>>({ datos: categorias })
  } catch (error) {
    console.error("Error al obtener categorías:", error)
    return NextResponse.json<RespuestaAPI<null>>(
      { error: "Error al obtener las categorías" },
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

    const { nombre, descripcion } = await solicitud.json()

    if (!nombre) {
      return NextResponse.json<RespuestaAPI<null>>(
        { error: "El nombre de la categoría es obligatorio" },
        { status: 400 }
      )
    }

    const slug = slugify(nombre, { lower: true, strict: true, locale: "es" })
    const cantidad = await prisma.categoria.count()

    const categoria = await prisma.categoria.create({
      data: { nombre, slug, descripcion, orden: cantidad },
    })

    return NextResponse.json<RespuestaAPI<Categoria>>(
      { datos: categoria, mensaje: "Categoría creada correctamente" },
      { status: 201 }
    )
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json<RespuestaAPI<null>>(
        { error: "Ya existe una categoría con ese nombre" },
        { status: 409 }
      )
    }
    console.error("Error al crear categoría:", error)
    return NextResponse.json<RespuestaAPI<null>>(
      { error: "Error al crear la categoría" },
      { status: 500 }
    )
  }
}
