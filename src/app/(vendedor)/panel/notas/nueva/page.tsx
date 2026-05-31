import Link from "next/link"
import FormularioNota from "@/components/notas/FormularioNota"

export default function PaginaNuevaNota() {
  return (
    <div>
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: "28px",
          fontWeight: 300,
          letterSpacing: "0.05em",
          color: "var(--color-texto)",
        }}>
          Nueva nota
        </h1>
      </div>

      <FormularioNota />

      <div style={{
        display: "flex",
        gap: "12px",
        marginTop: "24px",
        justifyContent: "flex-end",
      }}>
        <Link
          href="/panel/notas"
          style={{
            padding: "12px 24px",
            fontSize: "11px",
            fontFamily: "'Jost', sans-serif",
            fontWeight: 400,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            backgroundColor: "transparent",
            color: "var(--color-texto)",
            border: "0.5px solid var(--color-texto)",
            textDecoration: "none",
            display: "inline-block",
          }}
        >
          Cancelar
        </Link>
        <button
          type="submit"
          form="formulario-nota"
          style={{
            padding: "12px 32px",
            fontSize: "11px",
            fontFamily: "'Jost', sans-serif",
            fontWeight: 400,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            backgroundColor: "var(--color-texto)",
            color: "var(--color-fondo)",
            border: "none",
            borderRadius: 0,
            cursor: "pointer",
          }}
        >
          Guardar nota
        </button>
      </div>
    </div>
  )
}
