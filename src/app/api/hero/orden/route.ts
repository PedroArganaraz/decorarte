import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { crearClienteServidor } from "@/lib/supabase/servidor"
import type { RespuestaAPI } from "@/tipos"

export async function PATCH(solicitud: NextRequest) {
  try {
    const supabase = await crearClienteServidor()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json<RespuestaAPI<null>>({ error: "No autorizado" }, { status: 401 })
    }

    const { imagenes } = await solicitud.json() as { imagenes: { id: string; orden: number }[] }

    if (!Array.isArray(imagenes) || imagenes.length === 0) {
      return NextResponse.json<RespuestaAPI<null>>({ error: "Faltan datos" }, { status: 400 })
    }

    await prisma.$transaction(
      imagenes.map(({ id, orden }) =>
        prisma.imagenHero.update({ where: { id }, data: { orden } })
      )
    )

    revalidatePath("/")
    return NextResponse.json<RespuestaAPI<null>>({ datos: null })
  } catch (error) {
    console.error("Error al reordenar imágenes hero:", error)
    return NextResponse.json<RespuestaAPI<null>>({ error: "Error al reordenar" }, { status: 500 })
  }
}
