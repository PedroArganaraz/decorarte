import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { crearClienteServidor, crearClienteAdmin } from "@/lib/supabase/servidor"
import type { RespuestaAPI } from "@/tipos"

export async function POST(
  solicitud: NextRequest,
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

    const { id: productoId } = await params
    const formData = await solicitud.formData()
    const archivo = formData.get("archivo") as File
    const esPrincipal = formData.get("esPrincipal") === "true"

    if (!archivo) {
      return NextResponse.json<RespuestaAPI<null>>(
        { error: "No se envió ningún archivo" },
        { status: 400 }
      )
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

    const cantidadImagenes = await prisma.imagenProducto.count({
      where: { productoId },
    })

    const extension = archivo.name.split(".").pop()
    const pathInterno = `${productoId}/${Date.now()}.${extension}`

    const supabaseAdmin = crearClienteAdmin()
    const { error: errorSubida } = await supabaseAdmin.storage
      .from("productos")
      .upload(pathInterno, archivo, {
        contentType: archivo.type,
        upsert: false,
      })

    if (errorSubida) {
      console.error("Error al subir imagen a Storage:", errorSubida)
      return NextResponse.json<RespuestaAPI<null>>(
        { error: "Error al subir la imagen" },
        { status: 500 }
      )
    }

    const { data: urlData } = supabaseAdmin.storage
      .from("productos")
      .getPublicUrl(pathInterno)

    if (esPrincipal) {
      await prisma.imagenProducto.updateMany({
        where: { productoId },
        data: { esPrincipal: false },
      })
    }

    const imagen = await prisma.imagenProducto.create({
      data: {
        productoId,
        urlPublica: urlData.publicUrl,
        pathInterno,
        esPrincipal: esPrincipal || cantidadImagenes === 0,
        orden: cantidadImagenes,
        altText: archivo.name.replace(/\.[^/.]+$/, ""),
      },
    })

    return NextResponse.json<RespuestaAPI<typeof imagen>>(
      { datos: imagen, mensaje: "Imagen subida correctamente" },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error al procesar imagen:", error)
    return NextResponse.json<RespuestaAPI<null>>(
      { error: "Error al procesar la imagen" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  solicitud: NextRequest,
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

    const { searchParams } = new URL(solicitud.url)
    const imagenId = searchParams.get("imagenId")

    if (!imagenId) {
      return NextResponse.json<RespuestaAPI<null>>(
        { error: "Falta el ID de la imagen" },
        { status: 400 }
      )
    }

    const imagen = await prisma.imagenProducto.findUnique({
      where: { id: imagenId },
    })

    if (!imagen) {
      return NextResponse.json<RespuestaAPI<null>>(
        { error: "Imagen no encontrada" },
        { status: 404 }
      )
    }

    const supabaseAdmin = crearClienteAdmin()
    await supabaseAdmin.storage.from("productos").remove([imagen.pathInterno])
    await prisma.imagenProducto.delete({ where: { id: imagenId } })

    if (imagen.esPrincipal) {
      const { id: productoId } = await params
      const siguienteImagen = await prisma.imagenProducto.findFirst({
        where: { productoId },
        orderBy: { orden: "asc" },
      })
      if (siguienteImagen) {
        await prisma.imagenProducto.update({
          where: { id: siguienteImagen.id },
          data: { esPrincipal: true },
        })
      }
    }

    return NextResponse.json<RespuestaAPI<null>>({
      mensaje: "Imagen eliminada correctamente",
    })
  } catch (error) {
    console.error("Error al eliminar imagen:", error)
    return NextResponse.json<RespuestaAPI<null>>(
      { error: "Error al eliminar la imagen" },
      { status: 500 }
    )
  }
}
