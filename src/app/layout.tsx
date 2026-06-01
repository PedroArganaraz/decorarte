import type { Metadata } from "next"
import { Toaster } from "sonner"
import { Analytics } from "@vercel/analytics/react"
import "./globals.css"

export const metadata: Metadata = {
  title: "Decorarte — Accesorios artesanales",
  description: "Anillos, collares, pulseras y aros artesanales. Cada pieza es única.",
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
  },
}

export default function LayoutRaiz({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>
        {children}
        <Toaster position="bottom-center" />
        <Analytics />
      </body>
    </html>
  )
}
