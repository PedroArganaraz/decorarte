import Encabezado from "@/components/layout/Encabezado"
import PiePagina from "@/components/layout/PiePagina"
import BotonWhatsapp from "@/components/layout/BotonWhatsapp"

export default async function LayoutPublico({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Encabezado />
      <main style={{ minHeight: "70vh" }}>
        {children}
      </main>
      <PiePagina />
      <BotonWhatsapp />
    </>
  )
}
