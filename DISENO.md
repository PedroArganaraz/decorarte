# DISEÑO — Decorarte

## Identidad
E-commerce de accesorios artesanales (anillos, collares, pulseras, aros, sets).
Estética: elegante, minimalista, editorial. Inspirado en joyería boutique argentina.

---

## Tipografía

| Uso | Fuente | Peso | Características |
|-----|--------|------|----------------|
| Títulos, nombres de producto, precios | Cormorant Garamond | 300–400 | letter-spacing: 0.05em |
| UI, navegación, botones, labels | Jost | 300–400–500 | letter-spacing: 0.08–0.15em |

Importar en globals.css o layout.tsx:
```
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Jost:wght@300;400;500&display=swap');
```

Clases Tailwind a definir como custom:
- font-display → Cormorant Garamond
- font-ui → Jost

---

## Paleta de colores

| Variable CSS | Hex | Uso |
|-------------|-----|-----|
| --color-fondo | #EAEAEA | Fondo general de la página |
| --color-superficie | #F1EFE8 | Fondos de imágenes, secciones secundarias |
| --color-card | #FFFFFF | Cards de producto, paneles |
| --color-borde | #D3D1C7 | Todos los bordes |
| --color-texto | #2C2C2A | Texto principal, botones primarios |
| --color-texto-muted | #888780 | Categorías, labels secundarios |
| --color-texto-sutil | #B4B2A9 | Placeholders, precios tachados |

Definir en globals.css:
```css
:root {
  --color-fondo: #EAEAEA;
  --color-superficie: #F1EFE8;
  --color-card: #FFFFFF;
  --color-borde: #D3D1C7;
  --color-texto: #2C2C2A;
  --color-texto-muted: #888780;
  --color-texto-sutil: #B4B2A9;
}
```

---

## Componentes

### Botones
- Sin border-radius (esquinas rectas)
- Texto en uppercase, font Jost, font-size 11px, letter-spacing 0.12em, font-weight 400
- Primario: bg #2C2C2A, texto #EAEAEA
- Secundario: bg transparente, borde 0.5px #2C2C2A, texto #2C2C2A
- WhatsApp: igual al secundario + ícono SVG de WhatsApp a la izquierda, sin verde

### Cards de producto
- Fondo blanco, borde 0.5px #D3D1C7, sin border-radius o radius mínimo (2–4px)
- Imagen: proporción 1:1 o 4:5, fondo #F1EFE8
- Badge (Nuevo / Destacado / Oferta): bg #2C2C2A, texto #EAEAEA, 9px uppercase, esquinas rectas, posición absolute top-left
- Categoría: 9px, uppercase, letter-spacing 0.12em, color #888780
- Nombre: Cormorant Garamond 15px, color #2C2C2A
- Precio: Jost 13px, color #2C2C2A
- Precio anterior tachado: 11px, color #B4B2A9

### Header público
- Fondo #EAEAEA
- Franja superior: 11px, Jost, texto muted — mensajes de envío/info
- Logo centrado: Cormorant Garamond, 28px, letter-spacing 0.2em, uppercase
- Navegación por categorías debajo del logo: 11px uppercase Jost, color muted, activo con underline
- Íconos de búsqueda y carrito alineados a la derecha

### Panel del carrito (drawer lateral)
- Fondo blanco, borde izquierdo 0.5px #D3D1C7
- Título: Cormorant Garamond 18px
- Items: imagen pequeña (44×56px) + nombre + precio + cantidad
- Separadores: 0.5px #F1EFE8
- Total: label uppercase 11px + precio Cormorant Garamond 17px
- CTA: botón WhatsApp al 100% de ancho

### Inputs y formularios
- Sin border-radius
- Borde 0.5px #D3D1C7, fondo #FFFFFF
- Label: Jost 11px uppercase letter-spacing 0.1em
- Texto: Jost 14px
- Focus: borde #2C2C2A
- El panel del vendedor puede tener fondo ligeramente más oscuro (#F1EFE8) para diferenciar del público

---

## Categorías del catálogo

- Todos
- Anillos
- Collares
- Pulseras
- Aros
- Sets

---

## Estructura de páginas

### Home (/)
1. Header con logo + navegación categorías
2. Hero: imagen full-width o texto editorial grande centrado
3. Sección "Destacados": grilla 3 o 4 columnas
4. Sección por categoría (opcional)
5. Footer: info de contacto + redes

### Catálogo (/catalogo)
1. Header
2. Filtros por categoría (tabs o pills horizontales)
3. Grilla de productos: 3 columnas desktop, 2 tablet, 1 mobile
4. Footer

### Detalle de producto (/producto/[slug])
1. Header
2. Layout 2 columnas: galería izquierda | info derecha
3. Info: categoría, nombre, precio, descripción, botón agregar al carrito
4. Productos relacionados abajo

### Panel vendedor (/panel)
- Fondo #F1EFE8
- Sidebar izquierdo: logo + nav (Productos, Categorías, más adelante Órdenes)
- Contenido principal: fondo #FFFFFF, borde 0.5px #D3D1C7
- Tipografía más funcional, mantiene Cormorant para títulos de sección

---

## Reglas generales
- Nunca usar border-radius mayor a 4px en elementos de UI (excepción: avatares circulares)
- Nunca usar sombras (box-shadow) decorativas — solo outline en focus
- Nunca usar colores saturados — toda la paleta es neutra
- Espaciado generoso: padding mínimo 16px en cards, 24px en secciones
- Íconos: SVG simples, stroke 1–1.5px, color heredado del texto
