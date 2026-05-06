-- AlterTable
ALTER TABLE "productos" ADD COLUMN     "material_id" TEXT;

-- CreateTable
CREATE TABLE "materiales" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "categoria_id" TEXT NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "materiales_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "materiales_nombre_categoria_id_key" ON "materiales"("nombre", "categoria_id");

-- AddForeignKey
ALTER TABLE "productos" ADD CONSTRAINT "productos_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materiales"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materiales" ADD CONSTRAINT "materiales_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categorias"("id") ON DELETE CASCADE ON UPDATE CASCADE;
