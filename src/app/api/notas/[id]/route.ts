import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import type { RespuestaAPI } from "@/tipos"

export async function GET(
  _solicitud: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const nota = await prisma.nota.findUnique({
      where: { id: parseInt(id) },
    })

    if (!nota) {
      return NextResponse.json<RespuestaAPI<null>>(
        { error: "Nota no encontrada" },
        { status: 404 }
      )
    }

    return NextResponse.json<RespuestaAPI<typeof nota>>({ datos: nota })
  } catch (error) {
    console.error("Error al obtener nota:", error)
    return NextResponse.json<RespuestaAPI<null>>(
      { error: "Error al obtener la nota" },
      { status: 500 }
    )
  }
}

export async function PUT(
  solicitud: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { titulo, descripcion } = await solicitud.json()

    const nota = await prisma.nota.update({
      where: { id: parseInt(id) },
      data: {
        ...(titulo !== undefined && { titulo }),
        ...(descripcion !== undefined && { descripcion: descripcion || null }),
      },
    })

    return NextResponse.json<RespuestaAPI<typeof nota>>({
      datos: nota,
      mensaje: "Nota actualizada correctamente",
    })
  } catch (error) {
    console.error("Error al actualizar nota:", error)
    return NextResponse.json<RespuestaAPI<null>>(
      { error: "Error al actualizar la nota" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _solicitud: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.nota.delete({ where: { id: parseInt(id) } })

    return NextResponse.json<RespuestaAPI<null>>({
      mensaje: "Nota eliminada correctamente",
    })
  } catch (error) {
    console.error("Error al eliminar nota:", error)
    return NextResponse.json<RespuestaAPI<null>>(
      { error: "Error al eliminar la nota" },
      { status: 500 }
    )
  }
}
