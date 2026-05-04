export default function PaginaInicio() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "var(--color-fondo)",
      }}
    >
      <h1
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: "32px",
          fontWeight: 300,
          letterSpacing: "0.2em",
          color: "var(--color-texto)",
        }}
      >
        DECORARTE
      </h1>
    </main>
  )
}
