import Link from "next/link"

export default function PiePagina() {
  return (
    <footer style={{
      backgroundColor: "var(--color-texto)",
      color: "var(--color-fondo)",
      padding: "48px 24px",
      marginTop: "80px",
    }}>
      <div style={{
        maxWidth: "1200px",
        margin: "0 auto",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: "40px",
      }}>
        <div>
          <h2 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "22px",
            fontWeight: 300,
            letterSpacing: "0.2em",
            marginBottom: "16px",
          }}>
            DECORARTE
          </h2>
          <p style={{
            fontSize: "12px",
            fontWeight: 300,
            letterSpacing: "0.05em",
            lineHeight: 1.8,
            color: "var(--color-texto-muted)",
          }}>
            Más que un accesorio,<br />
            una forma de comunicar quién eres.
          </p>
        </div>

        <div>
          <h3 style={{
            fontSize: "10px",
            fontWeight: 500,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            marginBottom: "16px",
            color: "var(--color-texto-muted)",
          }}>
            Seguinos
          </h3>
          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}>
            {[
              { label: "Instagram", href: "https://www.instagram.com/decorarte.cba/" },
              { label: "TikTok", href: "https://www.tiktok.com/@decorarte.cba" },
              { label: "WhatsApp", href: "https://api.whatsapp.com/send/?phone=%2B5493512540654" },
            ].map((red: { label: string; href: string }) => (
              <a
                key={red.label}
                href={red.href}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: "12px",
                  fontWeight: 300,
                  letterSpacing: "0.05em",
                  color: "var(--color-texto-muted)",
                  textDecoration: "none",
                }}
              >
                {red.label}
              </a>
            ))}
          </div>
        </div>

        <div>
          <h3 style={{
            fontSize: "10px",
            fontWeight: 500,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            marginBottom: "16px",
            color: "var(--color-texto-muted)",
          }}>
            Navegación
          </h3>
          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}>
            {["Todos", "Aros", "Collares", "Pulseras", "Anillos"].map((item: string) => (
              <Link
                key={item}
                href={item === "Todos" ? "/catalogo" : `/catalogo?categoria=${item.toLowerCase()}`}
                style={{
                  fontSize: "12px",
                  fontWeight: 300,
                  letterSpacing: "0.05em",
                  color: "var(--color-texto-muted)",
                  textDecoration: "none",
                }}
              >
                {item}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div style={{
        maxWidth: "1200px",
        margin: "48px auto 0",
        paddingTop: "24px",
        borderTop: "0.5px solid #444441",
        fontSize: "10px",
        fontWeight: 300,
        letterSpacing: "0.08em",
        color: "var(--color-texto-muted)",
        textAlign: "center",
      }}>
        © {new Date().getFullYear()} Decorarte — Todos los derechos reservados
      </div>
    </footer>
  )
}
