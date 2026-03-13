-- Add tsvector columns and GIN indexes for full-text search

-- Service
ALTER TABLE "Service" ADD COLUMN IF NOT EXISTS "searchVector" tsvector;
UPDATE "Service" SET "searchVector" = to_tsvector('english', coalesce("name",'') || ' ' || coalesce("description",'') || ' ' || coalesce("category",'') || ' ' || coalesce("tagline",''));
CREATE INDEX IF NOT EXISTS "Service_search_idx" ON "Service" USING GIN ("searchVector");

CREATE OR REPLACE FUNCTION service_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW."searchVector" := to_tsvector('english', coalesce(NEW."name",'') || ' ' || coalesce(NEW."description",'') || ' ' || coalesce(NEW."category",'') || ' ' || coalesce(NEW."tagline",''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS service_search_vector_trigger ON "Service";
CREATE TRIGGER service_search_vector_trigger
  BEFORE INSERT OR UPDATE ON "Service"
  FOR EACH ROW EXECUTE FUNCTION service_search_vector_update();

-- Program
ALTER TABLE "Program" ADD COLUMN IF NOT EXISTS "searchVector" tsvector;
UPDATE "Program" SET "searchVector" = to_tsvector('english', coalesce("title",'') || ' ' || coalesce("description",''));
CREATE INDEX IF NOT EXISTS "Program_search_idx" ON "Program" USING GIN ("searchVector");

CREATE OR REPLACE FUNCTION program_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW."searchVector" := to_tsvector('english', coalesce(NEW."title",'') || ' ' || coalesce(NEW."description",''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS program_search_vector_trigger ON "Program";
CREATE TRIGGER program_search_vector_trigger
  BEFORE INSERT OR UPDATE ON "Program"
  FOR EACH ROW EXECUTE FUNCTION program_search_vector_update();

-- Course
ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "searchVector" tsvector;
UPDATE "Course" SET "searchVector" = to_tsvector('english', coalesce("title",'') || ' ' || coalesce("description",''));
CREATE INDEX IF NOT EXISTS "Course_search_idx" ON "Course" USING GIN ("searchVector");

CREATE OR REPLACE FUNCTION course_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW."searchVector" := to_tsvector('english', coalesce(NEW."title",'') || ' ' || coalesce(NEW."description",''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS course_search_vector_trigger ON "Course";
CREATE TRIGGER course_search_vector_trigger
  BEFORE INSERT OR UPDATE ON "Course"
  FOR EACH ROW EXECUTE FUNCTION course_search_vector_update();

-- Product
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "searchVector" tsvector;
UPDATE "Product" SET "searchVector" = to_tsvector('english', coalesce("title",'') || ' ' || coalesce("shortDescription",'') || ' ' || coalesce("longDescription",''));
CREATE INDEX IF NOT EXISTS "Product_search_idx" ON "Product" USING GIN ("searchVector");

CREATE OR REPLACE FUNCTION product_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW."searchVector" := to_tsvector('english', coalesce(NEW."title",'') || ' ' || coalesce(NEW."shortDescription",'') || ' ' || coalesce(NEW."longDescription",''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS product_search_vector_trigger ON "Product";
CREATE TRIGGER product_search_vector_trigger
  BEFORE INSERT OR UPDATE ON "Product"
  FOR EACH ROW EXECUTE FUNCTION product_search_vector_update();

-- BlogPost
ALTER TABLE "BlogPost" ADD COLUMN IF NOT EXISTS "searchVector" tsvector;
UPDATE "BlogPost" SET "searchVector" = to_tsvector('english', coalesce("title",'') || ' ' || coalesce("content",'') || ' ' || coalesce("excerpt",''));
CREATE INDEX IF NOT EXISTS "BlogPost_search_idx" ON "BlogPost" USING GIN ("searchVector");

CREATE OR REPLACE FUNCTION blogpost_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW."searchVector" := to_tsvector('english', coalesce(NEW."title",'') || ' ' || coalesce(NEW."content",'') || ' ' || coalesce(NEW."excerpt",''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS blogpost_search_vector_trigger ON "BlogPost";
CREATE TRIGGER blogpost_search_vector_trigger
  BEFORE INSERT OR UPDATE ON "BlogPost"
  FOR EACH ROW EXECUTE FUNCTION blogpost_search_vector_update();

-- AudioTrack
ALTER TABLE "AudioTrack" ADD COLUMN IF NOT EXISTS "searchVector" tsvector;
UPDATE "AudioTrack" SET "searchVector" = to_tsvector('english', coalesce("title",'') || ' ' || coalesce("description",'') || ' ' || coalesce("category",''));
CREATE INDEX IF NOT EXISTS "AudioTrack_search_idx" ON "AudioTrack" USING GIN ("searchVector");

CREATE OR REPLACE FUNCTION audiotrack_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW."searchVector" := to_tsvector('english', coalesce(NEW."title",'') || ' ' || coalesce(NEW."description",'') || ' ' || coalesce(NEW."category",''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audiotrack_search_vector_trigger ON "AudioTrack";
CREATE TRIGGER audiotrack_search_vector_trigger
  BEFORE INSERT OR UPDATE ON "AudioTrack"
  FOR EACH ROW EXECUTE FUNCTION audiotrack_search_vector_update();

-- Healer (search on user.name + bio + specializations array)
ALTER TABLE "Healer" ADD COLUMN IF NOT EXISTS "searchVector" tsvector;
UPDATE "Healer" SET "searchVector" = to_tsvector('english', coalesce("bio",'') || ' ' || array_to_string("specializations", ' '));
CREATE INDEX IF NOT EXISTS "Healer_search_idx" ON "Healer" USING GIN ("searchVector");

CREATE OR REPLACE FUNCTION healer_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW."searchVector" := to_tsvector('english', coalesce(NEW."bio",'') || ' ' || array_to_string(NEW."specializations", ' '));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS healer_search_vector_trigger ON "Healer";
CREATE TRIGGER healer_search_vector_trigger
  BEFORE INSERT OR UPDATE ON "Healer"
  FOR EACH ROW EXECUTE FUNCTION healer_search_vector_update();
