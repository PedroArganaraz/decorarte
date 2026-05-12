import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { crearClienteServidor, crearClienteAdmin } from "@/lib/supabase/servidor"
import type { RespuestaAPI } from "@/tipos"

export async function PATCH(
  solicitud: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await crearClienteServidor()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json<RespuestaAPI<null>>({ error: "No autorizado" }, { status: 401 })
    }

    const { id } = await params
    const { posicion } = await solicitud.json() as { posicion: number }

    if (!Number.isInteger(posicion) || posicion < 0 || posicion > 100) {
      return NextResponse.json<RespuestaAPI<null>>({ error: "Posición inválida" }, { status: 400 })
    }

    const imagen = await prisma.imagenHero.update({
      where: { id },
      data: { posicion },
    })

    revalidatePath("/")
    return NextResponse.json<RespuestaAPI<typeof imagen>>({ datos: imagen })
  } catch (error) {
    console.error("Error al actualizar posición:", error)
    return NextResponse.json<RespuestaAPI<null>>({ error: "Error al actualizar" }, { status: 500 })
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
      return NextResponse.json<RespuestaAPI<null>>({ error: "No autorizado" }, { status: 401 })
    }

    const { id } = await params

    const imagen = await prisma.imagenHero.findUnique({ where: { id } })

    if (!imagen) {
      return NextResponse.json<RespuestaAPI<null>>({ error: "Imagen no encontrada" }, { status: 404 })
    }

    const supabaseAdmin = crearClienteAdmin()
    await supabaseAdmin.storage.from("productos").remove([imagen.pathInterno])
    await prisma.imagenHero.delete({ where: { id } })

    revalidatePath("/")
    return NextResponse.json<RespuestaAPI<null>>({ mensaje: "Imagen eliminada correctamente" })
  } catch (error) {
    console.error("Error al eliminar imagen hero:", error)
    return NextResponse.json<RespuestaAPI<null>>({ error: "Error al eliminar la imagen" }, { status: 500 })
  }
}
