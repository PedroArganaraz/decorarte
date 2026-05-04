"use client"

import { useState } from "react"
import { usarCarrito } from "@/tiendas/carritoTienda"
import { toast } from "sonner"

interface Props {
  producto: {
    id: string
    nombre: string
    precio: number
    slug: string
    imagenes: { urlPublica: string; esPrincipal: boolean }[]
  }
}

export default function BotonAgregarCarrito({ producto }: Props) {
  const [agregado, setAgregado] = useState(false)
  const agregarItem = usarCarrito((s) => s.agregarItem)

  const manejarClick = () => {
    const imagenPrincipal = producto.imagenes.find((img) => img.esPrincipal)
      ?? producto.imagenes[0]

    agregarItem({
      productoId: producto.id,
      nombre: producto.nombre,
      precio: producto.precio,
      cantidad: 1,
      imagenUrl: imagenPrincipal?.urlPublica ?? "",
      slug: producto.slug,
    })

    setAgregado(true)
    toast.success(`${producto.nombre} agregado al carrito`)

    setTimeout(() => setAgregado(false), 2000)
  }

  return (
    <button
      onClick={manejarClick}
      style={{
        width: "100%",
        padding: "16px",
        fontSize: "11px",
        fontFamily: "'Jost', sans-serif",
        fontWeight: 400,
        letterSpacing: "0.15em",
        textTransform: "uppercase",
        backgroundColor: agregado ? "var(--color-texto-muted)" : "var(--color-texto)",
        color: "var(--color-fondo)",
        border: "none",
        borderRadius: 0,
        cursor: "pointer",
        transition: "background-color 0.2s ease",
      }}
    >
      {agregado ? "✓ Agregado" : "Agregar al carrito"}
    </button>
  )
}
