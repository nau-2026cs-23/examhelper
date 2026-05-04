-- Initial schema migration for Exam Reminder System

CREATE TABLE IF NOT EXISTS "users" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL UNIQUE,
  "password_hash" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'user',
  "status" TEXT NOT NULL DEFAULT 'active',
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "exams" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "title" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "exam_type" TEXT NOT NULL DEFAULT 'other',
  "exam_date" TEXT NOT NULL,
  "exam_time" TEXT NOT NULL,
  "location" TEXT NOT NULL,
  "description" TEXT,
  "review_progress" INTEGER NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL DEFAULT 'upcoming',
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "tasks" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "exam_id" TEXT REFERENCES "exams"("id") ON DELETE SET NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "priority" TEXT NOT NULL DEFAULT 'medium',
  "status" TEXT NOT NULL DEFAULT 'pending',
  "due_date" TEXT,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "notification_settings" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" TEXT NOT NULL UNIQUE REFERENCES "users"("id") ON DELETE CASCADE,
  "channels" JSONB NOT NULL DEFAULT '["system"]'::jsonb,
  "intervals" JSONB NOT NULL DEFAULT '["7days","1day"]'::jsonb,
  "custom_interval_days" INTEGER,
  "email_enabled" BOOLEAN NOT NULL DEFAULT false,
  "browser_enabled" BOOLEAN NOT NULL DEFAULT false,
  "system_enabled" BOOLEAN NOT NULL DEFAULT true,
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "announcements" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

INSERT INTO "users" ("id", "name", "email", "password_hash", "role", "status")
VALUES (
  gen_random_uuid(),
  'Admin',
  'admin@examreminder.com',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  'admin',
  'active'
) ON CONFLICT ("email") DO NOTHING;
