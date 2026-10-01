// scripts/comprimir-imagenes.mjs
//
// Respalda, comprime y (opcionalmente) restaura las imágenes del bucket "productos".
// Se ejecuta en TU computadora, no en Supabase.
//
// Uso:
//   node scripts/comprimir-imagenes.mjs respaldar   [--limite=N]
//   node scripts/comprimir-imagenes.mjs comprimir   [--limite=N]
//   node scripts/comprimir-imagenes.mjs subir       [--limite=N]
//   node scripts/comprimir-imagenes.mjs restaurar   [--limite=N]
//
// Flujo:
//   1. respaldar  -> descarga los originales a ./respaldo-imagenes/originales (misma estructura de carpetas)
//   2. comprimir  -> genera versiones livianas en ./respaldo-imagenes/comprimidas (NO toca Supabase)
//   3. subir      -> sobrescribe en Supabase CADA archivo con su versión comprimida (misma ruta, mismo nombre)
//   4. restaurar  -> vuelve a subir los originales de los archivos que fueron comprimidos
//
// Requiere: npm i sharp @supabase/supabase-js dotenv
// Variables de entorno (.env.local o .env):
//   NEXT_PUBLIC_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY   (nunca la subas a git)

import dotenv from "dotenv";
import fs from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

dotenv.config({ path: ".env.local" });
dotenv.config();

// ---------- Configuración ----------
const BUCKET = "productos";
const DIR_RAIZ = "./respaldo-imagenes";
const DIR_ORIGINALES = path.join(DIR_RAIZ, "originales");
const DIR_COMPRIMIDAS = path.join(DIR_RAIZ, "comprimidas");
const ANCHO_MAXIMO = 1600; // px
const CALIDAD = 82; // 1-100
const UMBRAL_KB = 300; // archivos ya livianos y chicos no se tocan
const CACHE_SUBIDA = "604800"; // 7 días, en segundos
const EXTENSIONES = [".jpg", ".jpeg", ".png", ".webp", ".avif"];

const TIPOS_MIME = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".avif": "image/avif",
};

// ---------- Argumentos ----------
const [comando, ...resto] = process.argv.slice(2);
const argumentoLimite = resto.find((a) => a.startsWith("--limite="));
const LIMITE = argumentoLimite ? Number(argumentoLimite.split("=")[1]) : Infinity;

// ---------- Utilidades ----------
let clienteSupabase = null;
function obtenerCliente() {
  if (clienteSupabase) return clienteSupabase;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const clave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !clave) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local / .env"
    );
  }
  clienteSupabase = createClient(url, clave, { auth: { persistSession: false } });
  return clienteSupabase;
}

const esImagen = (ruta) => EXTENSIONES.includes(path.extname(ruta).toLowerCase());
const tipoMime = (ruta) => TIPOS_MIME[path.extname(ruta).toLowerCase()] ?? "application/octet-stream";
const mb = (bytes) => (bytes / 1024 / 1024).toFixed(2);

async function existe(ruta) {
  try {
    await fs.access(ruta);
    return true;
  } catch {
    return false;
  }
}

// Lista recursivamente los archivos del bucket
async function listarArchivosRemotos(prefijo = "") {
  const supabase = obtenerCliente();
  const archivos = [];
  let desplazamiento = 0;
  const TAMANO_PAGINA = 100;

  while (true) {
    const { data, error } = await supabase.storage.from(BUCKET).list(prefijo, {
      limit: TAMANO_PAGINA,
      offset: desplazamiento,
      sortBy: { column: "name", order: "asc" },
    });
    if (error) throw error;
    if (!data || data.length === 0) break;

    for (const item of data) {
      const ruta = prefijo ? `${prefijo}/${item.name}` : item.name;
      if (item.id === null) {
        // es una carpeta
        archivos.push(...(await listarArchivosRemotos(ruta)));
      } else {
        archivos.push({ ruta, bytes: item.metadata?.size ?? 0 });
      }
    }
    if (data.length < TAMANO_PAGINA) break;
    desplazamiento += TAMANO_PAGINA;
  }
  return archivos;
}

// Lista recursivamente los archivos de una carpeta local, con rutas relativas (estilo bucket)
async function listarArchivosLocales(directorioBase, subruta = "") {
  const actual = path.join(directorioBase, subruta);
  if (!(await existe(actual))) return [];
  const entradas = await fs.readdir(actual, { withFileTypes: true });
  const archivos = [];
  for (const entrada of entradas) {
    const relativa = subruta ? `${subruta}/${entrada.name}` : entrada.name;
    if (entrada.isDirectory()) {
      archivos.push(...(await listarArchivosLocales(directorioBase, relativa)));
    } else if (esImagen(entrada.name)) {
      const { size } = await fs.stat(path.join(directorioBase, relativa));
      archivos.push({ ruta: relativa, bytes: size });
    }
  }
  return archivos;
}

const masPesadosPrimero = (a, b) => b.bytes - a.bytes;

// ---------- Comandos ----------
async function respaldar() {
  const supabase = obtenerCliente();
  console.log("Listando archivos del bucket...");
  const remotos = (await listarArchivosRemotos())
    .filter((a) => esImagen(a.ruta))
    .sort(masPesadosPrimero)
    .slice(0, LIMITE);

  const totalMb = mb(remotos.reduce((suma, a) => suma + a.bytes, 0));
  console.log(`${remotos.length} imágenes a respaldar (~${totalMb} MB de descarga)\n`);

  let descargadas = 0;
  let yaExistentes = 0;
  let fallidas = 0;

  for (const [indice, archivo] of remotos.entries()) {
    const destino = path.join(DIR_ORIGINALES, archivo.ruta);
    if (await existe(destino)) {
      yaExistentes++;
      continue;
    }
    const { data, error } = await supabase.storage.from(BUCKET).download(archivo.ruta);
    if (error) {
      fallidas++;
      console.error(`✗ ${archivo.ruta}: ${error.message}`);
      continue;
    }
    await fs.mkdir(path.dirname(destino), { recursive: true });
    await fs.writeFile(destino, Buffer.from(await data.arrayBuffer()));
    descargadas++;
    console.log(`[${indice + 1}/${remotos.length}] ✓ ${archivo.ruta} (${mb(archivo.bytes)} MB)`);
  }

  console.log(
    `\nListo. Descargadas: ${descargadas} | Ya respaldadas: ${yaExistentes} | Fallidas: ${fallidas}`
  );
  console.log(`Respaldo en: ${path.resolve(DIR_ORIGINALES)}`);
}

async function comprimir() {
  const originales = (await listarArchivosLocales(DIR_ORIGINALES))
    .sort(masPesadosPrimero)
    .slice(0, LIMITE);

  if (originales.length === 0) {
    console.log("No hay originales respaldados. Corré primero: respaldar");
    return;
  }

  let totalAntes = 0;
  let totalDespues = 0;
  let comprimidas = 0;
  let omitidas = 0;
  const reporte = [];

  for (const [indice, original] of originales.entries()) {
    const rutaOrigen = path.join(DIR_ORIGINALES, original.ruta);
    const rutaDestino = path.join(DIR_COMPRIMIDAS, original.ruta);
    const entrada = await fs.readFile(rutaOrigen);
    const metadatos = await sharp(entrada).metadata();

    // Ya es liviana y chica: no se toca
    if (original.bytes <= UMBRAL_KB * 1024 && (metadatos.width ?? 0) <= ANCHO_MAXIMO) {
      omitidas++;
      reporte.push({ ruta: original.ruta, estado: "omitida (ya liviana)", antes: original.bytes });
      continue;
    }

    // rotate() aplica la orientación EXIF para que la foto no quede girada
    let procesador = sharp(entrada)
      .rotate()
      .resize({ width: ANCHO_MAXIMO, withoutEnlargement: true });

    switch (metadatos.format) {
      case "jpeg":
        procesador = procesador.jpeg({ quality: CALIDAD, mozjpeg: true });
        break;
      case "png":
        procesador = procesador.png({ compressionLevel: 9 });
        break;
      case "webp":
        procesador = procesador.webp({ quality: CALIDAD });
        break;
      case "avif":
        procesador = procesador.avif({ quality: 60 });
        break;
      default:
        omitidas++;
        reporte.push({ ruta: original.ruta, estado: `omitida (formato ${metadatos.format})`, antes: original.bytes });
        continue;
    }

    const salida = await procesador.toBuffer();

    // Si no mejora, se deja el original tal cual
    if (salida.length >= original.bytes) {
      omitidas++;
      reporte.push({ ruta: original.ruta, estado: "omitida (no mejora)", antes: original.bytes });
      continue;
    }

    await fs.mkdir(path.dirname(rutaDestino), { recursive: true });
    await fs.writeFile(rutaDestino, salida);

    comprimidas++;
    totalAntes += original.bytes;
    totalDespues += salida.length;
    reporte.push({
      ruta: original.ruta,
      estado: "comprimida",
      antes: original.bytes,
      despues: salida.length,
    });
    console.log(
      `[${indice + 1}/${originales.length}] ${original.ruta}: ${mb(original.bytes)} MB -> ${mb(salida.length)} MB`
    );
  }

  await fs.mkdir(DIR_RAIZ, { recursive: true });
  await fs.writeFile(path.join(DIR_RAIZ, "reporte.json"), JSON.stringify(reporte, null, 2));

  console.log(`\nComprimidas: ${comprimidas} | Omitidas: ${omitidas}`);
  console.log(`Peso de las comprimidas: ${mb(totalAntes)} MB -> ${mb(totalDespues)} MB`);
  console.log(`Revisá las imágenes en: ${path.resolve(DIR_COMPRIMIDAS)}`);
  console.log("Supabase NO fue modificado. Para aplicar los cambios: subir");
}

async function subir() {
  const supabase = obtenerCliente();
  const comprimidas = (await listarArchivosLocales(DIR_COMPRIMIDAS)).slice(0, LIMITE);

  if (comprimidas.length === 0) {
    console.log("No hay imágenes comprimidas. Corré primero: comprimir");
    return;
  }

  let subidas = 0;
  let omitidas = 0;
  let fallidas = 0;

  for (const [indice, archivo] of comprimidas.entries()) {
    // Seguridad: nunca se sobrescribe si no existe el respaldo del original
    const rutaRespaldo = path.join(DIR_ORIGINALES, archivo.ruta);
    if (!(await existe(rutaRespaldo))) {
      omitidas++;
      console.error(`⚠ ${archivo.ruta}: sin respaldo del original, se omite`);
      continue;
    }

    const contenido = await fs.readFile(path.join(DIR_COMPRIMIDAS, archivo.ruta));
    const { error } = await supabase.storage.from(BUCKET).upload(archivo.ruta, contenido, {
      contentType: tipoMime(archivo.ruta),
      upsert: true, // misma ruta y mismo nombre: la URL no cambia
      cacheControl: CACHE_SUBIDA,
    });
    if (error) {
      fallidas++;
      console.error(`✗ ${archivo.ruta}: ${error.message}`);
      continue;
    }
    subidas++;
    console.log(`[${indice + 1}/${comprimidas.length}] ✓ ${archivo.ruta}`);
  }

  console.log(`\nListo. Subidas: ${subidas} | Omitidas: ${omitidas} | Fallidas: ${fallidas}`);
  console.log("Para volver atrás: restaurar");
}

async function restaurar() {
  const supabase = obtenerCliente();
  // Se restauran solo los archivos que fueron comprimidos (los que están en "comprimidas")
  const modificadas = (await listarArchivosLocales(DIR_COMPRIMIDAS)).slice(0, LIMITE);

  if (modificadas.length === 0) {
    console.log("No hay nada para restaurar.");
    return;
  }

  let restauradas = 0;
  let fallidas = 0;

  for (const [indice, archivo] of modificadas.entries()) {
    const rutaRespaldo = path.join(DIR_ORIGINALES, archivo.ruta);
    if (!(await existe(rutaRespaldo))) {
      fallidas++;
      console.error(`✗ ${archivo.ruta}: no se encontró el respaldo`);
      continue;
    }
    const contenido = await fs.readFile(rutaRespaldo);
    const { error } = await supabase.storage.from(BUCKET).upload(archivo.ruta, contenido, {
      contentType: tipoMime(archivo.ruta),
      upsert: true,
      cacheControl: "3600",
    });
    if (error) {
      fallidas++;
      console.error(`✗ ${archivo.ruta}: ${error.message}`);
      continue;
    }
    restauradas++;
    console.log(`[${indice + 1}/${modificadas.length}] ↩ ${archivo.ruta}`);
  }

  console.log(`\nRestauradas: ${restauradas} | Fallidas: ${fallidas}`);
}

// ---------- Entrada ----------
const comandos = { respaldar, comprimir, subir, restaurar };

if (!comandos[comando]) {
  console.log("Uso: node scripts/comprimir-imagenes.mjs <respaldar|comprimir|subir|restaurar> [--limite=N]");
  process.exit(1);
}

comandos[comando]().catch((error) => {
  console.error("Error:", error.message ?? error);
  process.exit(1);
});
