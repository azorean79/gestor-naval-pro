-- CreateTable
CREATE TABLE "CustomPackType" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdByUserId" INTEGER,
    "updatedByUserId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomPackType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomPackTypeItem" (
    "id" SERIAL NOT NULL,
    "customPackTypeId" INTEGER NOT NULL,
    "stockId" INTEGER,
    "stockReference" TEXT NOT NULL,
    "stockDescription" TEXT NOT NULL,
    "stockCategory" TEXT,
    "quantity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomPackTypeItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CustomPackType_name_key" ON "CustomPackType"("name");

-- CreateIndex
CREATE INDEX "CustomPackType_isActive_idx" ON "CustomPackType"("isActive");

-- CreateIndex
CREATE INDEX "CustomPackType_name_idx" ON "CustomPackType"("name");

-- CreateIndex
CREATE INDEX "CustomPackTypeItem_customPackTypeId_idx" ON "CustomPackTypeItem"("customPackTypeId");

-- CreateIndex
CREATE INDEX "CustomPackTypeItem_stockId_idx" ON "CustomPackTypeItem"("stockId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomPackTypeItem_customPackTypeId_stockReference_key" ON "CustomPackTypeItem"("customPackTypeId", "stockReference");

-- AddForeignKey
ALTER TABLE "CustomPackType" ADD CONSTRAINT "CustomPackType_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomPackType" ADD CONSTRAINT "CustomPackType_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomPackTypeItem" ADD CONSTRAINT "CustomPackTypeItem_customPackTypeId_fkey" FOREIGN KEY ("customPackTypeId") REFERENCES "CustomPackType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomPackTypeItem" ADD CONSTRAINT "CustomPackTypeItem_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "Stock"("id") ON DELETE SET NULL ON UPDATE CASCADE;