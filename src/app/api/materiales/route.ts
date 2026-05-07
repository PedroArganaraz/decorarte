import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { crearClienteServidor } from "@/lib/supabase/servidor"
import type { RespuestaAPI } from "@/tipos"
import type { Prisma } from "@prisma/client"
type Material = Prisma.MaterialGetPayload<{}>

export async function GET(solicitud: NextRequest) {
  try {
    const { searchParams } = new URL(solicitud.url)
    const categoriaId = searchParams.get("categoriaId")

    const materiales = await prisma.material.findMany({
      where: categoriaId ? { categoriaId } : undefined,
      orderBy: { nombre: "asc" },
    })

    return NextResponse.json<RespuestaAPI<Material[]>>({ datos: materiales })
  } catch (error) {
    console.error("Error al obtener materiales:", error)
    return NextResponse.json<RespuestaAPI<null>>(
      { error: "Error al obtener los materiales" },
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

    const { nombre, categoriaId } = await solicitud.json()

    if (!nombre || !categoriaId) {
      return NextResponse.json<RespuestaAPI<null>>(
        { error: "Nombre y categoría son obligatorios" },
        { status: 400 }
      )
    }

    const material = await prisma.material.create({
      data: { nombre, categoriaId },
    })

    return NextResponse.json<RespuestaAPI<Material>>(
      { datos: material, mensaje: "Material creado correctamente" },
      { status: 201 }
    )
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json<RespuestaAPI<null>>(
        { error: "Ya existe ese material en esta categoría" },
        { status: 409 }
      )
    }
    console.error("Error al crear material:", error)
    return NextResponse.json<RespuestaAPI<null>>(
      { error: "Error al crear el material" },
      { status: 500 }
    )
  }
}
