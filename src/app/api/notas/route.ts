import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import type { RespuestaAPI } from "@/tipos"

export async function GET() {
  try {
    const notas = await prisma.nota.findMany({
      orderBy: { actualizado_en: "desc" },
    })
    return NextResponse.json<RespuestaAPI<typeof notas>>({ datos: notas })
  } catch (error) {
    console.error("Error al obtener notas:", error)
    return NextResponse.json<RespuestaAPI<null>>(
      { error: "Error al obtener las notas" },
      { status: 500 }
    )
  }
}

export async function POST(solicitud: NextRequest) {
  try {
    const { titulo, descripcion } = await solicitud.json()

    if (!titulo) {
      return NextResponse.json<RespuestaAPI<null>>(
        { error: "El título es obligatorio" },
        { status: 400 }
      )
    }

    const nota = await prisma.nota.create({
      data: { titulo, descripcion: descripcion || null },
    })

    return NextResponse.json<RespuestaAPI<typeof nota>>(
      { datos: nota, mensaje: "Nota creada correctamente" },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error al crear nota:", error)
    return NextResponse.json<RespuestaAPI<null>>(
      { error: "Error al crear la nota" },
      { status: 500 }
    )
  }
}
