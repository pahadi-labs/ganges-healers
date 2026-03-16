-- CreateTable: CommunityTopic
CREATE TABLE "CommunityTopic" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunityTopic_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CommunityTopic_slug_key" ON "CommunityTopic"("slug");

-- CreateIndex
CREATE INDEX "CommunityTopic_isActive_order_idx" ON "CommunityTopic"("isActive", "order");

-- CreateTable: CommunityTag
CREATE TABLE "CommunityTag" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunityTag_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CommunityTag_slug_key" ON "CommunityTag"("slug");

-- CreateTable: CommunityPostTag (join table)
CREATE TABLE "CommunityPostTag" (
    "postId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "CommunityPostTag_pkey" PRIMARY KEY ("postId","tagId")
);

-- CreateIndex
CREATE INDEX "CommunityPostTag_tagId_idx" ON "CommunityPostTag"("tagId");

-- CreateTable: CommunityReport
CREATE TABLE "CommunityReport" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunityReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CommunityReport_status_idx" ON "CommunityReport"("status");

-- CreateIndex
CREATE INDEX "CommunityReport_targetType_targetId_idx" ON "CommunityReport"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "CommunityReport_userId_idx" ON "CommunityReport"("userId");

-- AlterTable: CommunityPost - add new columns
ALTER TABLE "CommunityPost" ADD COLUMN "topicId" TEXT;
ALTER TABLE "CommunityPost" ADD COLUMN "isPinned" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "CommunityPost" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "CommunityPost" ADD COLUMN "deletedById" TEXT;
ALTER TABLE "CommunityPost" ADD COLUMN "searchVector" tsvector;

-- CreateIndex (new indexes on CommunityPost)
CREATE INDEX "CommunityPost_topicId_idx" ON "CommunityPost"("topicId");
CREATE INDEX "CommunityPost_isPinned_idx" ON "CommunityPost"("isPinned");
CREATE INDEX "CommunityPost_deletedAt_idx" ON "CommunityPost"("deletedAt");

-- GIN index for full-text search on CommunityPost
CREATE INDEX "CommunityPost_searchVector_idx" ON "CommunityPost" USING GIN ("searchVector");

-- AlterTable: CommunityComment - add soft-delete + updatedAt
ALTER TABLE "CommunityComment" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "CommunityComment" ADD COLUMN "deletedById" TEXT;
ALTER TABLE "CommunityComment" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "CommunityComment_deletedAt_idx" ON "CommunityComment"("deletedAt");

-- AddForeignKey
ALTER TABLE "CommunityPost" ADD CONSTRAINT "CommunityPost_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "CommunityTopic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CommunityPost" ADD CONSTRAINT "CommunityPost_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CommunityComment" ADD CONSTRAINT "CommunityComment_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CommunityPostTag" ADD CONSTRAINT "CommunityPostTag_postId_fkey" FOREIGN KEY ("postId") REFERENCES "CommunityPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CommunityPostTag" ADD CONSTRAINT "CommunityPostTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "CommunityTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CommunityReport" ADD CONSTRAINT "CommunityReport_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CommunityReport" ADD CONSTRAINT "CommunityReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Trigger: auto-update searchVector on CommunityPost INSERT/UPDATE
CREATE OR REPLACE FUNCTION community_post_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW."searchVector" := setweight(to_tsvector('english', COALESCE(NEW."title", '')), 'A') ||
                        setweight(to_tsvector('english', COALESCE(NEW."content", '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER community_post_search_vector_trigger
  BEFORE INSERT OR UPDATE OF "title", "content" ON "CommunityPost"
  FOR EACH ROW
  EXECUTE FUNCTION community_post_search_vector_update();

-- Backfill searchVector for existing rows
UPDATE "CommunityPost" SET "searchVector" =
  setweight(to_tsvector('english', COALESCE("title", '')), 'A') ||
  setweight(to_tsvector('english', COALESCE("content", '')), 'B');

-- Seed default topics
INSERT INTO "CommunityTopic" ("id", "slug", "name", "description", "order") VALUES
  ('topic_healing_journey', 'healing-journey', 'Healing Journey', 'Share your personal healing experiences and breakthroughs', 1),
  ('topic_meditation', 'meditation-mindfulness', 'Meditation & Mindfulness', 'Discuss meditation practices and mindfulness techniques', 2),
  ('topic_energy_healing', 'energy-healing', 'Energy Healing', 'Explore energy healing modalities and experiences', 3),
  ('topic_hypnotherapy', 'hypnotherapy-experiences', 'Hypnotherapy Experiences', 'Share hypnotherapy sessions and outcomes', 4),
  ('topic_spiritual_growth', 'spiritual-growth', 'Spiritual Growth', 'Conversations about spiritual development and awakening', 5),
  ('topic_program_discussions', 'program-discussions', 'Program Discussions', 'Discuss platform programs and course experiences', 6);

-- Seed default tags
INSERT INTO "CommunityTag" ("id", "slug", "name") VALUES
  ('tag_anxiety', 'anxiety', 'Anxiety'),
  ('tag_sleep', 'sleep', 'Sleep'),
  ('tag_confidence', 'confidence', 'Confidence'),
  ('tag_self_love', 'self-love', 'Self Love'),
  ('tag_manifestation', 'manifestation', 'Manifestation'),
  ('tag_stress', 'stress', 'Stress'),
  ('tag_relationships', 'relationships', 'Relationships'),
  ('tag_gratitude', 'gratitude', 'Gratitude');
