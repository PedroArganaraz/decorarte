import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { crearClienteServidor } from "@/lib/supabase/servidor"
import type { RespuestaAPI } from "@/tipos"

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

    const productosConMaterial = await prisma.producto.count({
      where: { materialId: id },
    })

    if (productosConMaterial > 0) {
      return NextResponse.json<RespuestaAPI<null>>(
        { error: `No se puede eliminar, hay ${productosConMaterial} producto/s usando este material` },
        { status: 409 }
      )
    }

    const materialAEliminar = await prisma.material.findUnique({
      where: { id },
      select: { nombre: true },
    })

    if (materialAEliminar) {
      await prisma.producto.updateMany({
        where: { material: materialAEliminar.nombre },
        data: { material: null },
      })
    }

    await prisma.material.delete({ where: { id } })

    return NextResponse.json<RespuestaAPI<null>>({
      mensaje: "Material eliminado correctamente",
    })
  } catch (error) {
    console.error("Error al eliminar material:", error)
    return NextResponse.json<RespuestaAPI<null>>(
      { error: "Error al eliminar el material" },
      { status: 500 }
    )
  }
}
