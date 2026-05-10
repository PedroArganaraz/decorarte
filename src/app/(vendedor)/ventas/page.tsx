import Link from "next/link"
import HistorialVentas from "@/components/ventas/HistorialVentas"

export default function PaginaHistorialVentas() {
  return (
    <div style={{ padding: "32px", minHeight: "100vh", backgroundColor: "var(--color-fondo)" }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-end",
        marginBottom: "28px",
      }}>
        <div>
          <h1 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "28px",
            fontWeight: 300,
            letterSpacing: "0.05em",
            color: "var(--color-texto)",
            margin: 0,
          }}>
            Ventas
          </h1>
          <p style={{
            fontSize: "11px",
            fontFamily: "'Jost', sans-serif",
            color: "var(--color-texto-muted)",
            marginTop: "6px",
            letterSpacing: "0.05em",
          }}>
            Registro de ventas por período
          </p>
        </div>
        <Link
          href="/ventas/nueva"
          style={{
            padding: "10px 20px",
            fontSize: "11px",
            fontFamily: "'Jost', sans-serif",
            fontWeight: 400,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            backgroundColor: "var(--color-texto)",
            color: "var(--color-fondo)",
            textDecoration: "none",
            display: "inline-block",
          }}
        >
          + Nueva venta
        </Link>
      </div>
      <HistorialVentas />
    </div>
  )
}
