import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Decorarte — Accesorios artesanales",
  description: "Anillos, collares, pulseras y aros artesanales. Cada pieza es única.",
}

export default function LayoutRaiz({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
