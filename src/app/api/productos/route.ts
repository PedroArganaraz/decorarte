import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { crearClienteServidor } from "@/lib/supabase/servidor"
import slugify from "slugify"
import type { RespuestaAPI, ProductoResumen } from "@/tipos"

export async function GET(solicitud: NextRequest) {
  try {
    const { searchParams } = new URL(solicitud.url)
    const categoriaSlug = searchParams.get("categoria")
    const soloDestacados = searchParams.get("destacados") === "true"
    const busqueda = searchParams.get("busqueda")
    const material = searchParams.get("material")

    const productos = await prisma.producto.findMany({
      where: {
        activo: true,
        ...(categoriaSlug && { categoria: { slug: categoriaSlug } }),
        ...(soloDestacados && { destacado: true }),
        ...(busqueda && { nombre: { contains: busqueda, mode: "insensitive" } }),
        ...(material && { material: { equals: material, mode: "insensitive" } }),
      },
      select: {
        id: true,
        nombre: true,
        slug: true,
        precio: true,
        precioAnterior: true,
        stock: true,
        activo: true,
        destacado: true,
        material: true,
        imagenes: {
          select: { urlPublica: true, altText: true, esPrincipal: true },
          orderBy: { orden: "asc" },
        },
        categoria: { select: { nombre: true, slug: true } },
      },
      orderBy: [{ categoria: { nombre: "asc" } }, { nombre: "asc" }],
    })

    return NextResponse.json<RespuestaAPI<ProductoResumen[]>>({ datos: productos })
  } catch (error) {
    console.error("Error al obtener productos:", error)
    return NextResponse.json<RespuestaAPI<null>>(
      { error: "Error al obtener los productos" },
      { status: 500 }
    )
  }
}

export async function POST(solicitud: NextRequest) {
  try {
    const supabase = await crearClienteServidor()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json<RespuestaAPI<null>>(
        { error: "No autorizado" },
        { status: 401 }
      )
    }

    // Asegurar que el usuario existe en nuestra tabla
    await prisma.usuario.upsert({
      where: { id: user.id },
      create: {
        id: user.id,
        email: user.email ?? "",
        nombre: user.email?.split("@")[0] ?? "Vendedor",
        rol: "VENDEDOR",
      },
      update: {},
    })

    const cuerpo = await solicitud.json()
    const { nombre, descripcion, precio, precioAnterior, stock, activo, destacado, categoriaId, material, talle, color, creadoEn } = cuerpo

    if (!nombre || !precio || !categoriaId) {
      return NextResponse.json<RespuestaAPI<null>>(
        { error: "Faltan campos obligatorios: nombre, precio, categoría" },
        { status: 400 }
      )
    }

    const slugBase = slugify(nombre, { lower: true, strict: true, locale: "es" })
    const productoExistente = await prisma.producto.findUnique({ where: { slug: slugBase } })
    const slug = productoExistente ? `${slugBase}-${Date.now()}` : slugBase

    let materialId: string | null = null
    if (material && categoriaId) {
      const materialEncontrado = await prisma.material.findFirst({
        where: { nombre: material, categorias: { some: { id: categoriaId } } },
      })
      materialId = materialEncontrado?.id ?? null
    }

    const producto = await prisma.producto.create({
      data: {
        nombre,
        slug,
        descripcion,
        precio,
        precioAnterior: precioAnterior || null,
        stock: stock ?? 0,
        activo: activo ?? true,
        destacado: destacado ?? false,
        talle: talle || null,
        material: material || null,
        color: color || null,
        materialId,
        categoriaId,
        vendedorId: user.id,
        ...(creadoEn && { creadoEn: new Date(creadoEn) }),
      },
      include: { categoria: true, imagenes: true },
    })

    revalidatePath("/")
    revalidatePath("/catalogo")

    return NextResponse.json<RespuestaAPI<typeof producto>>(
      { datos: producto, mensaje: "Producto creado correctamente" },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error al crear producto:", error)
    return NextResponse.json<RespuestaAPI<null>>(
      { error: "Error al crear el producto" },
      { status: 500 }
    )
  }
}
