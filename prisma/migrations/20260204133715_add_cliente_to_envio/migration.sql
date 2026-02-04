-- AlterTable
ALTER TABLE "envios" ADD COLUMN     "clienteId" TEXT;

-- AddForeignKey
ALTER TABLE "envios" ADD CONSTRAINT "envios_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
