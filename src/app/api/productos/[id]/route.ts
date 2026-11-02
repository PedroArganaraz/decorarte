import { NextRequest, NextResponse } from "next/server"
import { descontarInsumo, restaurarInsumo } from "@/lib/insumos"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { crearClienteServidor, crearClienteAdmin } from "@/lib/supabase/servidor"
import slugify from "slugify"
import type { RespuestaAPI } from "@/tipos"
import { Prisma } from "@prisma/client"

const MENSAJE_PRODUCTO_CON_VENTAS =
  "No se puede eliminar este producto porque tiene ventas registradas. Dejalo inactivo para ocultarlo del catálogo."

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
    const { nombre, descripcion, precio, precioAnterior, costo, precioMinimo, stock, activo, destacado, marcado, categoriaId, material, talle, color, creadoEn } = cuerpo
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
      // Restaurar cantidadDisponible de insumos anteriores (los cerrados no reciben stock)
      const insumosAnteriores = await tx.insumoProducto.findMany({ where: { productoId: id } })
      for (const anterior of insumosAnteriores) {
        await restaurarInsumo(tx, anterior.insumoId, Number(anterior.cantidadUsada))
      }
      await tx.insumoProducto.deleteMany({ where: { productoId: id } })

      // Crear nuevos registros de insumos
      for (const ins of insumosData) {
        const insumo = await tx.insumo.findUnique({ where: { id: ins.insumoId } })
        if (!insumo) continue

        if (insumo.cerrado) {
          // Un insumo cerrado no se puede sumar ni descontar de nuevo: si el producto ya lo
          // usaba, se conserva la cantidad usada que tenía; si no, se ignora.
          const previo = insumosAnteriores.find((a) => a.insumoId === ins.insumoId)
          if (previo) {
            await tx.insumoProducto.create({
              data: { insumoId: ins.insumoId, productoId: id, cantidadUsada: Number(previo.cantidadUsada) },
            })
          }
          continue
        }

        if (Number(insumo.cantidadDisponible) < ins.cantidadUsada) continue
        await tx.insumoProducto.create({
          data: { insumoId: ins.insumoId, productoId: id, cantidadUsada: ins.cantidadUsada },
        })
        await descontarInsumo(tx, ins.insumoId, ins.cantidadUsada)
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
          ...(marcado !== undefined && { marcado }),
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

    const ventasDelProducto = await prisma.itemVenta.count({ where: { productoId: id } })
    if (ventasDelProducto > 0) {
      return NextResponse.json<RespuestaAPI<null>>(
        { error: MENSAJE_PRODUCTO_CON_VENTAS },
        { status: 400 }
      )
    }

    await prisma.$transaction(async (tx) => {
      const insumosAsociados = await tx.insumoProducto.findMany({ where: { productoId: id } })
      for (const ip of insumosAsociados) {
        await restaurarInsumo(tx, ip.insumoId, Number(ip.cantidadUsada))
      }
      await tx.insumoProducto.deleteMany({ where: { productoId: id } })
      await tx.producto.delete({ where: { id } })
    })

    // Las imágenes se borran recién cuando el producto ya se eliminó de la base,
    // así un error de la transacción no deja al producto sin fotos.
    if (producto.imagenes.length > 0) {
      const supabaseAdmin = crearClienteAdmin()
      const paths = producto.imagenes.map((img) => img.pathInterno)
      await supabaseAdmin.storage.from("productos").remove(paths)
    }

    revalidatePath("/")
    revalidatePath("/catalogo")

    return NextResponse.json<RespuestaAPI<null>>({
      mensaje: "Producto eliminado correctamente",
    })
  } catch (error) {
    console.error("Error al eliminar producto:", error)
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      return NextResponse.json<RespuestaAPI<null>>(
        { error: MENSAJE_PRODUCTO_CON_VENTAS },
        { status: 400 }
      )
    }
    return NextResponse.json<RespuestaAPI<null>>(
      { error: "Error al eliminar el producto" },
      { status: 500 }
    )
  }
}
