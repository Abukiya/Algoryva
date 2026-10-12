-- AlterTable: nullable columns, so existing mistakes keep their values.
ALTER TABLE "Mistake" ADD COLUMN "outsideTitle" TEXT,
ADD COLUMN "outsideUrl" TEXT;
