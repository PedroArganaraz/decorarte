import FormularioVenta from "@/components/ventas/FormularioVenta"

export default function PaginaNuevaVenta() {
  return (
    <div style={{ padding: "32px", minHeight: "100vh", backgroundColor: "var(--color-fondo)" }}>
      <div style={{ marginBottom: "28px" }}>
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
      <FormularioVenta />
    </div>
  )
}
