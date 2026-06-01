import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { crearClienteServidor, crearClienteAdmin } from "@/lib/supabase/servidor"
import type { RespuestaAPI } from "@/tipos"

export async function GET(solicitud: NextRequest) {
  try {
    const supabase = await crearClienteServidor()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json<RespuestaAPI<null>>({ error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(solicitud.url)
    const vista = searchParams.get("vista") // "desktop" | "mobile" | null

    const imagenes = await prisma.imagenHero.findMany({
      where: {
        activa: true,
        ...(vista && { vista }),
      },
      orderBy: { orden: "asc" },
    })

    return NextResponse.json<RespuestaAPI<typeof imagenes>>({ datos: imagenes })
  } catch (error) {
    console.error("Error al obtener imágenes hero:", error)
    return NextResponse.json<RespuestaAPI<null>>({ error: "Error al obtener las imágenes" }, { status: 500 })
  }
}

export async function POST(solicitud: NextRequest) {
  try {
    const supabase = await crearClienteServidor()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json<RespuestaAPI<null>>({ error: "No autorizado" }, { status: 401 })
    }

    const formData = await solicitud.formData()
    const archivo = formData.get("archivo") as File
    const vista = (formData.get("vista") as string) || "desktop"

    if (!archivo) {
      return NextResponse.json<RespuestaAPI<null>>({ error: "No se envió ningún archivo" }, { status: 400 })
    }

    const tiposPermitidos = ["image/jpeg", "image/png", "image/webp", "image/avif"]
    if (!tiposPermitidos.includes(archivo.type)) {
      return NextResponse.json<RespuestaAPI<null>>(
        { error: "Tipo de archivo no permitido. Usar: JPG, PNG, WebP o AVIF" },
        { status: 400 }
      )
    }

    const MAX_BYTES = 5 * 1024 * 1024
    if (archivo.size > MAX_BYTES) {
      return NextResponse.json<RespuestaAPI<null>>(
        { error: "El archivo supera el tamaño máximo de 5MB" },
        { status: 400 }
      )
    }

    const cantidadImagenes = await prisma.imagenHero.count({ where: { activa: true, vista } })

    const extension = archivo.name.split(".").pop()
    const pathInterno = `hero/${Date.now()}.${extension}`

    const supabaseAdmin = crearClienteAdmin()
    const { error: errorSubida } = await supabaseAdmin.storage
      .from("productos")
      .upload(pathInterno, archivo, {
        contentType: archivo.type,
        upsert: false,
      })

    if (errorSubida) {
      console.error("Error al subir imagen hero a Storage:", errorSubida)
      return NextResponse.json<RespuestaAPI<null>>({ error: "Error al subir la imagen" }, { status: 500 })
    }

    const { data: urlData } = supabaseAdmin.storage.from("productos").getPublicUrl(pathInterno)

    const imagen = await prisma.imagenHero.create({
      data: {
        urlPublica: urlData.publicUrl,
        pathInterno,
        orden: cantidadImagenes,
        activa: true,
        vista,
      },
    })

    revalidatePath("/")
    return NextResponse.json<RespuestaAPI<typeof imagen>>(
      { datos: imagen, mensaje: "Imagen subida correctamente" },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error al procesar imagen hero:", error)
    return NextResponse.json<RespuestaAPI<null>>({ error: "Error al procesar la imagen" }, { status: 500 })
  }
}
