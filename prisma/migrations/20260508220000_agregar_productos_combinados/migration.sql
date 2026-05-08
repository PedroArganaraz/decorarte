-- Migración: tabla join para productos combinados (muchos a muchos auto-referencial)

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = '_ProductosCombinados'
  ) THEN
    CREATE TABLE "_ProductosCombinados" (
      "A" TEXT NOT NULL,
      "B" TEXT NOT NULL,
      CONSTRAINT "_ProductosCombinados_AB_unique" UNIQUE ("A","B")
    );
    CREATE INDEX "_ProductosCombinados_B_index" ON "_ProductosCombinados"("B");
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = '_ProductosCombinados_A_fkey'
  ) THEN
    ALTER TABLE "_ProductosCombinados"
      ADD CONSTRAINT "_ProductosCombinados_A_fkey"
      FOREIGN KEY ("A") REFERENCES "productos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = '_ProductosCombinados_B_fkey'
  ) THEN
    ALTER TABLE "_ProductosCombinados"
      ADD CONSTRAINT "_ProductosCombinados_B_fkey"
      FOREIGN KEY ("B") REFERENCES "productos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
