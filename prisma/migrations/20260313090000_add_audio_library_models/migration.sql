-- CreateTable
CREATE TABLE "AudioTrack" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "audioUrl" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AudioTrack_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AudioTrack_slug_key" ON "AudioTrack"("slug");

-- CreateIndex
CREATE INDEX "AudioTrack_category_idx" ON "AudioTrack"("category");

-- CreateIndex
CREATE INDEX "AudioTrack_isPremium_idx" ON "AudioTrack"("isPremium");
