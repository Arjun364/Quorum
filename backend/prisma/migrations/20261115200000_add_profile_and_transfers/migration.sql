-- CreateEnum
CREATE TYPE "TransferStatus" AS ENUM ('Pending', 'Completed', 'Rejected', 'Cancelled');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "avatarPublicId" TEXT,
ADD COLUMN     "avatarUrl" TEXT,
ADD COLUMN     "phone" TEXT;

-- CreateTable
CREATE TABLE "DepartmentTransfer" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "fromDepartmentId" INTEGER NOT NULL,
    "toDepartmentId" INTEGER NOT NULL,
    "initiatedBy" INTEGER NOT NULL,
    "status" "TransferStatus" NOT NULL DEFAULT 'Pending',
    "needFromHead" BOOLEAN NOT NULL,
    "needToHead" BOOLEAN NOT NULL,
    "needCompanyHead" BOOLEAN NOT NULL,
    "fromHeadApprovedAt" TIMESTAMP(3),
    "toHeadApprovedAt" TIMESTAMP(3),
    "companyHeadApprovedAt" TIMESTAMP(3),
    "decidedBy" INTEGER,
    "decisionNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "DepartmentTransfer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DepartmentTransfer_companyId_idx" ON "DepartmentTransfer"("companyId");

-- CreateIndex
CREATE INDEX "DepartmentTransfer_userId_idx" ON "DepartmentTransfer"("userId");

-- CreateIndex
CREATE INDEX "DepartmentTransfer_fromDepartmentId_idx" ON "DepartmentTransfer"("fromDepartmentId");

-- CreateIndex
CREATE INDEX "DepartmentTransfer_toDepartmentId_idx" ON "DepartmentTransfer"("toDepartmentId");

-- AddForeignKey
ALTER TABLE "DepartmentTransfer" ADD CONSTRAINT "DepartmentTransfer_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepartmentTransfer" ADD CONSTRAINT "DepartmentTransfer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepartmentTransfer" ADD CONSTRAINT "DepartmentTransfer_fromDepartmentId_fkey" FOREIGN KEY ("fromDepartmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepartmentTransfer" ADD CONSTRAINT "DepartmentTransfer_toDepartmentId_fkey" FOREIGN KEY ("toDepartmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
