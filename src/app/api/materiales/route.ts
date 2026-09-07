import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { crearClienteServidor } from "@/lib/supabase/servidor"
import type { RespuestaAPI } from "@/tipos"
import type { Material } from "@prisma/client"

export async function GET(solicitud: NextRequest) {
  try {
    const { searchParams } = new URL(solicitud.url)
    const categoriaId = searchParams.get("categoriaId")
    const source = searchParams.get("source")

    if (source === "productos") {
      const raw = await prisma.producto.findMany({
        where: {
          material: { not: null },
          ...(categoriaId && { categoriaId }),
        },
        select: { material: true },
        distinct: ["material"],
      })
      const nombres = [...new Set(
        raw
          .map((p) => p.material)
          .filter((m): m is string => typeof m === "string" && m.trim() !== "")
          .map((m) => m.charAt(0).toUpperCase() + m.slice(1).toLowerCase())
      )].sort()
      return NextResponse.json<RespuestaAPI<string[]>>({ datos: nombres })
    }

    const materiales = await prisma.material.findMany({
      where: categoriaId ? { categorias: { some: { id: categoriaId } } } : undefined,
      orderBy: { nombre: "asc" },
    })

    const materialesConConteo = await Promise.all(
      materiales.map(async (mat) => {
        const total = await prisma.producto.count({
          where: {
            OR: [
              { materialId: mat.id },
              { material: mat.nombre },
            ],
          },
        })
        return { ...mat, _count: { productos: total } }
      })
    )

    return NextResponse.json<RespuestaAPI<typeof materialesConConteo>>({ datos: materialesConConteo })
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

    const { nombre, categoriaIds } = await solicitud.json() as { nombre: string; categoriaIds: string[] }

    if (!nombre || !categoriaIds || categoriaIds.length === 0) {
      return NextResponse.json<RespuestaAPI<null>>(
        { error: "Nombre y al menos una categoría son obligatorios" },
        { status: 400 }
      )
    }

    const material = await prisma.material.create({
      data: {
        nombre,
        categorias: { connect: categoriaIds.map((id) => ({ id })) },
      },
    })

    return NextResponse.json<RespuestaAPI<Material>>(
      { datos: material, mensaje: "Material creado correctamente" },
      { status: 201 }
    )
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json<RespuestaAPI<null>>(
        { error: "Ya existe un material con ese nombre" },
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
