-- Migración: agregar costo y precio_minimo al modelo Producto

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'productos' AND column_name = 'costo'
  ) THEN
    ALTER TABLE "productos" ADD COLUMN "costo" DOUBLE PRECISION;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'productos' AND column_name = 'precio_minimo'
  ) THEN
    ALTER TABLE "productos" ADD COLUMN "precio_minimo" DOUBLE PRECISION;
  END IF;
END $$;
