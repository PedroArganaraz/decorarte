import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { crearClienteServidor, crearClienteAdmin } from "@/lib/supabase/servidor"
import slugify from "slugify"
import type { RespuestaAPI } from "@/tipos"

export async function GET(
  _solicitud: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const producto = await prisma.producto.findUnique({
      where: { id },
      include: {
        imagenes: { orderBy: { orden: "asc" } },
        categoria: true,
        vendedor: { select: { nombre: true } },
      },
    })

    if (!producto) {
      return NextResponse.json<RespuestaAPI<null>>(
        { error: "Producto no encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json<RespuestaAPI<typeof producto>>({ datos: producto })
  } catch (error) {
    console.error("Error al obtener producto:", error)
    return NextResponse.json<RespuestaAPI<null>>(
      { error: "Error al obtener el producto" },
      { status: 500 }
    )
  }
}

export async function PUT(
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

    const { id } = await params
    const cuerpo = await solicitud.json()
    const { nombre, descripcion, precio, precioAnterior, costo, precioMinimo, stock, activo, destacado, categoriaId, material, talle, color, creadoEn } = cuerpo
    const insumosData: { insumoId: number; cantidadUsada: number }[] = cuerpo.insumos ?? []

    let slug: string | undefined
    if (nombre) {
      const productoActual = await prisma.producto.findUnique({ where: { id } })
      if (productoActual && productoActual.nombre !== nombre) {
        const slugBase = slugify(nombre, { lower: true, strict: true, locale: "es" })
        const productoConSlug = await prisma.producto.findFirst({
          where: { slug: slugBase, id: { not: id } },
        })
        slug = productoConSlug ? `${slugBase}-${Date.now()}` : slugBase
      }
    }

    const productoActualizado = await prisma.$transaction(async (tx) => {
      // Restaurar cantidadDisponible de insumos anteriores
      const insumosAnteriores = await tx.insumoProducto.findMany({ where: { productoId: id } })
      for (const anterior of insumosAnteriores) {
        await tx.insumo.update({
          where: { id: anterior.insumoId },
          data: { cantidadDisponible: { increment: Number(anterior.cantidadUsada) } },
        })
      }
      await tx.insumoProducto.deleteMany({ where: { productoId: id } })

      // Crear nuevos registros de insumos
      for (const ins of insumosData) {
        const insumo = await tx.insumo.findUnique({ where: { id: ins.insumoId } })
        if (!insumo || insumo.cantidadDisponible < ins.cantidadUsada) continue
        await tx.insumoProducto.create({
          data: { insumoId: ins.insumoId, productoId: id, cantidadUsada: ins.cantidadUsada },
        })
        await tx.insumo.update({
          where: { id: ins.insumoId },
          data: { cantidadDisponible: { decrement: ins.cantidadUsada } },
        })
      }

      return tx.producto.update({
        where: { id },
        data: {
          ...(nombre && { nombre }),
          ...(slug && { slug }),
          ...(descripcion !== undefined && { descripcion }),
          ...(precio !== undefined && { precio }),
          ...(precioAnterior !== undefined && { precioAnterior: precioAnterior || null }),
          ...(stock !== undefined && { stock }),
          ...(activo !== undefined && { activo }),
          ...(destacado !== undefined && { destacado }),
          ...(categoriaId && { categoria: { connect: { id: categoriaId } } }),
          ...(material !== undefined && { material: material || null }),
          ...(talle !== undefined && { talle: talle || null }),
          ...(color !== undefined && { color: color || null }),
          ...(costo !== undefined && { costo: costo ?? null }),
          ...(precioMinimo !== undefined && { precioMinimo: precioMinimo ?? null }),
          ...(creadoEn !== undefined && { creadoEn: new Date(creadoEn) }),
        },
        include: {
          imagenes: { orderBy: { orden: "asc" } },
          categoria: true,
        },
      })
    })

    revalidatePath("/")
    revalidatePath("/catalogo")
    revalidatePath(`/producto/${productoActualizado.slug}`)

    return NextResponse.json<RespuestaAPI<typeof productoActualizado>>({
      datos: productoActualizado,
      mensaje: "Producto actualizado correctamente",
    })
  } catch (error) {
    console.error("Error al actualizar producto:", error)
    return NextResponse.json<RespuestaAPI<null>>(
      { error: "Error al actualizar el producto" },
      { status: 500 }
    )
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
      return NextResponse.json<RespuestaAPI<null>>(
        { error: "No autorizado" },
        { status: 401 }
      )
    }

    const { id } = await params

    const producto = await prisma.producto.findUnique({
      where: { id },
      include: { imagenes: true },
    })

    if (!producto) {
      return NextResponse.json<RespuestaAPI<null>>(
        { error: "Producto no encontrado" },
        { status: 404 }
      )
    }

    if (producto.imagenes.length > 0) {
      const supabaseAdmin = crearClienteAdmin()
      const paths = producto.imagenes.map((img) => img.pathInterno)
      await supabaseAdmin.storage.from("productos").remove(paths)
    }

    await prisma.$transaction(async (tx) => {
      const insumosAsociados = await tx.insumoProducto.findMany({ where: { productoId: id } })
      for (const ip of insumosAsociados) {
        await tx.insumo.update({
          where: { id: ip.insumoId },
          data: { cantidadDisponible: { increment: Number(ip.cantidadUsada) } },
        })
      }
      await tx.insumoProducto.deleteMany({ where: { productoId: id } })
      await tx.producto.delete({ where: { id } })
    })

    revalidatePath("/")
    revalidatePath("/catalogo")

    return NextResponse.json<RespuestaAPI<null>>({
      mensaje: "Producto eliminado correctamente",
    })
  } catch (error) {
    console.error("Error al eliminar producto:", error)
    return NextResponse.json<RespuestaAPI<null>>(
      { error: "Error al eliminar el producto" },
      { status: 500 }
    )
  }
}
