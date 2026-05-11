import Link from "next/link"
import FormularioVenta from "@/components/ventas/FormularioVenta"

export default function PaginaNuevaVenta() {
  return (
    <div style={{ padding: "32px", minHeight: "100vh", backgroundColor: "var(--color-fondo)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px" }}>
        <div>
          <h1 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "26px",
            fontWeight: 400,
            letterSpacing: "0.05em",
            color: "var(--color-texto)",
            margin: 0,
          }}>
            Nueva venta
          </h1>
          <p style={{
            fontSize: "11px",
            fontFamily: "'Jost', sans-serif",
            color: "var(--color-texto-muted)",
            marginTop: "6px",
            letterSpacing: "0.05em",
          }}>
            Registrá una venta presencial
          </p>
        </div>
        <Link
          href="/ventas"
          style={{
            padding: "8px 14px",
            fontSize: "10px",
            fontFamily: "'Jost', sans-serif",
            fontWeight: 400,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            border: "0.5px solid var(--color-texto)",
            backgroundColor: "transparent",
            color: "var(--color-texto)",
            textDecoration: "none",
            display: "inline-block",
            borderRadius: 0,
          }}
        >
          ← Volver
        </Link>
      </div>
      <FormularioVenta />
    </div>
  )
}
