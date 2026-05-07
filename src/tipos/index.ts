import type { Prisma } from "@prisma/client"

type Producto = Prisma.ProductoGetPayload<{}>
type Categoria = Prisma.CategoriaGetPayload<{}>
type ImagenProducto = Prisma.ImagenProductoGetPayload<{}>

export type ProductoConImagenes = Producto & {
  imagenes: ImagenProducto[]
  categoria: Categoria
}

export type ProductoResumen = Pick<
  Producto,
  "id" | "nombre" | "slug" | "precio" | "precioAnterior" | "stock" | "activo" | "destacado"
> & {
  imagenes: Pick<ImagenProducto, "urlPublica" | "altText" | "esPrincipal">[]
  categoria: Pick<Categoria, "nombre" | "slug">
}

export interface ItemCarritoUI {
  productoId: string
  nombre: string
  precio: number
  cantidad: number
  imagenUrl: string
  slug: string
}

export interface EstadoCarrito {
  items: ItemCarritoUI[]
  agregarItem: (producto: ItemCarritoUI) => void
  quitarItem: (productoId: string) => void
  actualizarCantidad: (productoId: string, cantidad: number) => void
  vaciarCarrito: () => void
  totalItems: () => number
  totalPrecio: () => number
}

export interface RespuestaAPI<T> {
  datos?: T
  error?: string
  mensaje?: string
}
