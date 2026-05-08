"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { crearClienteNavegador } from "@/lib/supabase/cliente"
import Link from "next/link"

function FormularioLogin() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirigir = searchParams.get("redirigir") || "/panel"

  const manejarLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setCargando(true)
    setError(null)

    const supabase = crearClienteNavegador()
    const { error: errorAuth } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (errorAuth) {
      setError("Email o contraseña incorrectos")
      setCargando(false)
      return
    }

    router.push(redirigir)
    router.refresh()
  }

  return (
    <form onSubmit={manejarLogin} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <label style={{
          fontSize: "10px",
          fontWeight: 500,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "var(--color-texto-muted)",
        }}>
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{
            padding: "12px 14px",
            fontSize: "14px",
            fontFamily: "'Jost', sans-serif",
            fontWeight: 300,
            backgroundColor: "var(--color-card)",
            border: "0.5px solid var(--color-borde)",
            borderRadius: 0,
            color: "var(--color-texto)",
            outline: "none",
            width: "100%",
          }}
        />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <label style={{
          fontSize: "10px",
          fontWeight: 500,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "var(--color-texto-muted)",
        }}>
          Contraseña
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{
            padding: "12px 14px",
            fontSize: "14px",
            fontFamily: "'Jost', sans-serif",
            fontWeight: 300,
            backgroundColor: "var(--color-card)",
            border: "0.5px solid var(--color-borde)",
            borderRadius: 0,
            color: "var(--color-texto)",
            outline: "none",
            width: "100%",
          }}
        />
      </div>

      {error && (
        <p style={{
          fontSize: "12px",
          color: "#A32D2D",
          letterSpacing: "0.03em",
        }}>
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={cargando}
        style={{
          marginTop: "8px",
          padding: "14px",
          fontSize: "11px",
          fontFamily: "'Jost', sans-serif",
          fontWeight: 400,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          backgroundColor: cargando ? "var(--color-texto-muted)" : "var(--color-texto)",
          color: "var(--color-fondo)",
          border: "none",
          borderRadius: 0,
          cursor: cargando ? "not-allowed" : "pointer",
          transition: "background-color 0.15s ease",
        }}
      >
        {cargando ? "Ingresando..." : "Ingresar"}
      </button>
    </form>
  )
}

export default function PaginaLogin() {
  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "var(--color-fondo)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
    }}>
      <div style={{
        width: "100%",
        maxWidth: "380px",
      }}>
        <Link
          href="/"
          style={{
            fontSize: "11px",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--color-texto-muted)",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            marginBottom: "32px",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          Inicio
        </Link>

        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <h1 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "28px",
            fontWeight: 300,
            letterSpacing: "0.2em",
            color: "var(--color-texto)",
            marginBottom: "8px",
          }}>
            DECORARTE
          </h1>
          <p style={{
            fontSize: "11px",
            fontWeight: 400,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--color-texto-muted)",
          }}>
            Panel de gestión
          </p>
        </div>

        <Suspense fallback={null}>
          <FormularioLogin />
        </Suspense>
      </div>
    </div>
  )
}
