-- Migración: materiales muchos-a-muchos con deduplicación robusta

DO $$
DECLARE
  col_exists BOOLEAN;
  tabla_join_exists BOOLEAN;
BEGIN

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'materiales' AND column_name = 'categoria_id'
  ) INTO col_exists;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = '_CategoriasMateriales'
  ) INTO tabla_join_exists;

  -- Paso 1: Crear tabla join si no existe
  IF NOT tabla_join_exists THEN
    CREATE TABLE "_CategoriasMateriales" (
      "A" TEXT NOT NULL,
      "B" TEXT NOT NULL,
      CONSTRAINT "_CategoriasMateriales_AB_unique" UNIQUE ("A","B")
    );
    CREATE INDEX "_CategoriasMateriales_B_index" ON "_CategoriasMateriales"("B");
  END IF;

  -- Paso 2: Si categoria_id aún existe, migrar datos al join table
  IF col_exists THEN
    INSERT INTO "_CategoriasMateriales" ("A", "B")
    SELECT DISTINCT categoria_id, id
    FROM materiales
    WHERE categoria_id IS NOT NULL
    ON CONFLICT DO NOTHING;
  END IF;

  -- Paso 3: Deduplicar materiales por nombre
  -- 3a: Actualizar join table: apuntar duplicados al id conservado
  WITH grupos AS (
    SELECT nombre, MIN(id) AS id_conservar
    FROM materiales
    GROUP BY nombre
    HAVING COUNT(*) > 1
  ),
  duplicados AS (
    SELECT m.id AS id_duplicado, g.id_conservar
    FROM materiales m
    JOIN grupos g ON m.nombre = g.nombre
    WHERE m.id <> g.id_conservar
  )
  UPDATE "_CategoriasMateriales" j
  SET "B" = d.id_conservar
  FROM duplicados d
  WHERE j."B" = d.id_duplicado;

  -- 3b: Limpiar entradas duplicadas en join table que quedaron tras el UPDATE
  DELETE FROM "_CategoriasMateriales" j1
  WHERE EXISTS (
    SELECT 1 FROM "_CategoriasMateriales" j2
    WHERE j2."A" = j1."A" AND j2."B" = j1."B" AND j2.ctid < j1.ctid
  );

  -- 3c: Actualizar productos.material_id que apuntan a duplicados
  WITH grupos AS (
    SELECT nombre, MIN(id) AS id_conservar
    FROM materiales
    GROUP BY nombre
    HAVING COUNT(*) > 1
  ),
  duplicados AS (
    SELECT m.id AS id_duplicado, g.id_conservar
    FROM materiales m
    JOIN grupos g ON m.nombre = g.nombre
    WHERE m.id <> g.id_conservar
  )
  UPDATE productos p
  SET material_id = d.id_conservar
  FROM duplicados d
  WHERE p.material_id = d.id_duplicado;

  -- 3d: Eliminar materiales duplicados
  WITH grupos AS (
    SELECT nombre, MIN(id) AS id_conservar
    FROM materiales
    GROUP BY nombre
    HAVING COUNT(*) > 1
  )
  DELETE FROM materiales m
  USING grupos g
  WHERE m.nombre = g.nombre AND m.id <> g.id_conservar;

  -- Paso 4: Eliminar categoria_id si aún existe
  IF col_exists THEN
    IF EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'materiales_nombre_categoria_id_key'
    ) THEN
      ALTER TABLE "materiales" DROP CONSTRAINT "materiales_nombre_categoria_id_key";
    END IF;
    ALTER TABLE "materiales" DROP COLUMN "categoria_id";
  END IF;

END $$;

-- Paso 5: Agregar unique en nombre
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'materiales_nombre_key'
      AND conrelid = 'materiales'::regclass
  ) THEN
    ALTER TABLE "materiales" ADD CONSTRAINT "materiales_nombre_key" UNIQUE ("nombre");
  END IF;
END $$;

-- Paso 6: Agregar foreign keys al join table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = '_CategoriasMateriales_A_fkey'
  ) THEN
    ALTER TABLE "_CategoriasMateriales"
      ADD CONSTRAINT "_CategoriasMateriales_A_fkey"
      FOREIGN KEY ("A") REFERENCES "categorias"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = '_CategoriasMateriales_B_fkey'
  ) THEN
    ALTER TABLE "_CategoriasMateriales"
      ADD CONSTRAINT "_CategoriasMateriales_B_fkey"
      FOREIGN KEY ("B") REFERENCES "materiales"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
