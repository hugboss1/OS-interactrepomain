-- CreateTable
CREATE TABLE "genpoints_ledger" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "genpoints_ledger_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "genpoints_ledger_email_idx" ON "genpoints_ledger"("email");
