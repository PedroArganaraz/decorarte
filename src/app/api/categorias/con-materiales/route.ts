import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import type { RespuestaAPI } from "@/tipos"

export async function GET() {
  try {
    const categorias = await prisma.categoria.findMany({
      where: { activa: true },
      orderBy: { orden: "asc" },
      select: {
        id: true,
        nombre: true,
        slug: true,
        materiales: {
          select: { id: true, nombre: true },
        },
      },
    })

    return NextResponse.json<RespuestaAPI<typeof categorias>>({ datos: categorias })
  } catch (error) {
    console.error("Error al obtener categorías con materiales:", error)
    return NextResponse.json<RespuestaAPI<null>>(
      { error: "Error al obtener categorías" },
      { status: 500 }
    )
  }
}
