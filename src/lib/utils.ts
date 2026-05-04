import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatearPrecio(precio: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    useGrouping: false,
  }).format(precio)
}

export function generarMensajeWhatsapp(
  items: { nombre: string; cantidad: number; precio: number }[]
): string {
  const lineas = items.map(
    (item) =>
      `• ${item.cantidad}x ${item.nombre} - ${formatearPrecio(item.precio * item.cantidad)}`
  )
  const total = items.reduce((acc, item) => acc + item.precio * item.cantidad, 0)
  return encodeURIComponent(
    `Hola! Me gustaría hacer el siguiente pedido:\n\n${lineas.join("\n")}\n\n*Total: ${formatearPrecio(total)}*\n\n¿Está disponible?`
  )
}
