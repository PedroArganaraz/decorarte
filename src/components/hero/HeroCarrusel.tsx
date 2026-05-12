"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"

interface ImagenHero {
  id: string
  urlPublica: string
  posicion?: number
}

interface Props {
  imagenes: ImagenHero[]
  intervalo?: number
}

const heroEstatico = (
  <section style={{
    backgroundColor: "var(--color-superficie)",
    padding: "80px 24px",
    textAlign: "center",
    borderBottom: "0.5px solid var(--color-borde)",
  }}>
    <p style={{
      fontSize: "11px",
      fontWeight: 400,
      letterSpacing: "0.2em",
      textTransform: "uppercase",
      color: "var(--color-acento)",
      marginBottom: "16px",
    }}>
      Nueva colección
    </p>
    <h2 style={{
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: "clamp(32px, 5vw, 52px)",
      fontWeight: 300,
      letterSpacing: "0.05em",
      color: "var(--color-texto)",
      lineHeight: 1.1,
      maxWidth: "600px",
      margin: "0 auto 20px",
    }}>
      Piezas que resaltan tu esencia
    </h2>
    <p style={{
      fontSize: "16px",
      fontWeight: 300,
      letterSpacing: "0.05em",
      color: "var(--color-texto-muted)",
      marginBottom: "32px",
      lineHeight: 1.8,
    }}>
      Accesorios que te acompañen en tu día a día,<br />
      reflejando tu estilo personal y tu energía
    </p>
    <Link
      href="/catalogo"
      style={{
        display: "inline-block",
        padding: "14px 40px",
        fontSize: "11px",
        fontFamily: "'Jost', sans-serif",
        fontWeight: 400,
        letterSpacing: "0.15em",
        textTransform: "uppercase",
        backgroundColor: "var(--color-texto)",
        color: "var(--color-fondo)",
        textDecoration: "none",
      }}
    >
      Ver colección
    </Link>
  </section>
)

export default function HeroCarrusel({ imagenes, intervalo = 3 }: Props) {
  const [slideActual, setSlideActual] = useState(0)
  const [montado, setMontado] = useState(false)

  useEffect(() => {
    setMontado(true)
  }, [])

  useEffect(() => {
    if (!montado || imagenes.length <= 1) return
    const timer = setInterval(() => {
      setSlideActual((prev) => (prev + 1) % imagenes.length)
    }, intervalo * 1000)
    return () => clearInterval(timer)
  }, [montado, imagenes.length, intervalo])

  const prevSlide = () =>
    setSlideActual((prev) => (prev - 1 + imagenes.length) % imagenes.length)
  const nextSlide = () =>
    setSlideActual((prev) => (prev + 1) % imagenes.length)

  if (!montado || imagenes.length === 0) {
    return heroEstatico
  }

  const imagen = imagenes[slideActual]

  return (
    <section style={{
      position: "relative",
      minHeight: "clamp(400px, 80vh, 520px)",
      borderBottom: "0.5px solid var(--color-borde)",
      overflow: "hidden",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}>

      {/* Imagen de fondo con Next.js Image */}
      <div style={{ position: "absolute", inset: 0 }}>
        <Image
          key={imagen.id}
          src={imagen.urlPublica}
          alt=""
          fill
          priority={slideActual === 0}
          sizes="100vw"
          aria-hidden="true"
          style={{
            objectFit: "cover",
            objectPosition: `center ${imagen.posicion ?? 50}%`,
          }}
        />
      </div>

      {/* Overlay oscuro */}
      <div style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.15)",
      }} />

      {/* Contenido de texto */}
      <div style={{
        position: "relative",
        zIndex: 1,
        textAlign: "center",
        padding: "80px clamp(24px, 6vw, 80px)",
        width: "100%",
        textShadow: "0 1px 8px rgba(0,0,0,0.55)",
      }}>
        <p style={{
          fontSize: "11px",
          fontWeight: 400,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: "rgba(255, 255, 255, 0.9)",
          marginBottom: "16px",
        }}>
          Nueva colección
        </p>
        <h2 style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: "clamp(32px, 5vw, 52px)",
          fontWeight: 300,
          letterSpacing: "0.05em",
          color: "#ffffff",
          lineHeight: 1.1,
          maxWidth: "600px",
          margin: "0 auto 20px",
        }}>
          Piezas que resaltan tu esencia
        </h2>
        <p style={{
          fontSize: "18px",
          fontWeight: 300,
          letterSpacing: "0.05em",
          color: "rgba(255, 255, 255, 0.9)",
          marginBottom: "36px",
          lineHeight: 1.8,
        }}>
          Accesorios que te acompañen en tu día a día,<br />
          reflejando tu estilo personal y tu energía
        </p>
        <Link
          href="/catalogo"
          style={{
            display: "inline-block",
            padding: "14px 40px",
            fontSize: "11px",
            fontFamily: "'Jost', sans-serif",
            fontWeight: 400,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            backgroundColor: "#3D3835",
            color: "#ffffff",
            textDecoration: "none",
          }}
        >
          Ver colección
        </Link>
      </div>

      {/* Flechas de navegación */}
      {imagenes.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            aria-label="Imagen anterior"
            style={{
              position: "absolute",
              left: "clamp(8px, 2vw, 24px)",
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 2,
              backgroundColor: "rgba(255, 255, 255, 0.15)",
              color: "#ffffff",
              border: "0.5px solid rgba(255, 255, 255, 0.3)",
              width: "clamp(36px, 5vw, 44px)",
              height: "clamp(36px, 5vw, 44px)",
              cursor: "pointer",
              fontSize: "clamp(18px, 3vw, 24px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              lineHeight: "1",
            }}
          >
            ‹
          </button>
          <button
            onClick={nextSlide}
            aria-label="Imagen siguiente"
            style={{
              position: "absolute",
              right: "clamp(8px, 2vw, 24px)",
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 2,
              backgroundColor: "rgba(255, 255, 255, 0.15)",
              color: "#ffffff",
              border: "0.5px solid rgba(255, 255, 255, 0.3)",
              width: "clamp(36px, 5vw, 44px)",
              height: "clamp(36px, 5vw, 44px)",
              cursor: "pointer",
              fontSize: "clamp(18px, 3vw, 24px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              lineHeight: "1",
            }}
          >
            ›
          </button>

          {/* Dots */}
          <div style={{
            position: "absolute",
            bottom: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            gap: "clamp(4px, 1.5vw, 8px)",
            zIndex: 2,
          }}>
            {imagenes.map((_, i) => (
              <button
                key={i}
                onClick={() => setSlideActual(i)}
                aria-label={`Ir a imagen ${i + 1}`}
                style={{
                  width: i === slideActual ? "clamp(14px, 3.5vw, 22px)" : "clamp(5px, 1.5vw, 7px)",
                  height: "clamp(5px, 1.5vw, 7px)",
                  backgroundColor: i === slideActual ? "#ffffff" : "rgba(255, 255, 255, 0.45)",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  transition: "width 0.25s ease, background-color 0.25s ease",
                }}
              />
            ))}
          </div>
        </>
      )}
    </section>
  )
}
