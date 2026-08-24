-- CreateEnum
CREATE TYPE "Track" AS ENUM ('grammar', 'reading', 'listening');

-- CreateEnum
CREATE TYPE "QuestionSource" AS ENUM ('QUIZ', 'PRACTICE');

-- CreateEnum
CREATE TYPE "ExamSection" AS ENUM ('listening', 'reading', 'grammar', 'writing');

-- CreateEnum
CREATE TYPE "MediaKind" AS ENUM ('audio', 'image');

-- CreateTable
CREATE TABLE "Unit" (
    "id" SERIAL NOT NULL,
    "track" "Track" NOT NULL,
    "legacyId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "emoji" TEXT,
    "nameAr" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "title" TEXT,
    "type" TEXT,
    "tag" TEXT,
    "mascot" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Unit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Strategy" (
    "id" SERIAL NOT NULL,
    "unitId" INTEGER NOT NULL,
    "legacyId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "theme" TEXT,
    "icon" TEXT,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "badge" TEXT,
    "usage" TEXT,
    "videoUrl" TEXT,
    "tip" TEXT,
    "blocks" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Strategy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" SERIAL NOT NULL,
    "unitId" INTEGER NOT NULL,
    "strategyId" INTEGER,
    "source" "QuestionSource" NOT NULL,
    "order" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "opts" JSONB NOT NULL,
    "correctIndex" INTEGER NOT NULL,
    "explanation" TEXT,
    "audioUrl" TEXT,
    "audioAssetId" INTEGER,
    "imgUrl" TEXT,
    "passageText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Video" (
    "id" SERIAL NOT NULL,
    "unitId" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,
    "title" TEXT,
    "url" TEXT NOT NULL,

    CONSTRAINT "Video_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VocabCategory" (
    "id" SERIAL NOT NULL,
    "unitId" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "color" TEXT,

    CONSTRAINT "VocabCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VocabWord" (
    "id" SERIAL NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,
    "en" TEXT NOT NULL,
    "ar" TEXT NOT NULL,

    CONSTRAINT "VocabWord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaAsset" (
    "id" SERIAL NOT NULL,
    "kind" "MediaKind" NOT NULL,
    "filename" TEXT NOT NULL,
    "publicPath" TEXT NOT NULL,
    "originalName" TEXT,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "sha256" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteConfig" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteConfig_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "Admin" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLoginAt" TIMESTAMP(3),

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Student" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActiveAt" TIMESTAMP(3),

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentState" (
    "studentId" INTEGER NOT NULL,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "streak" INTEGER NOT NULL DEFAULT 0,
    "bestStreak" INTEGER NOT NULL DEFAULT 0,
    "lastActive" TEXT,
    "notes" JSONB NOT NULL DEFAULT '{}',
    "highlights" JSONB NOT NULL DEFAULT '{}',
    "srs" JSONB NOT NULL DEFAULT '{}',
    "analytics" JSONB NOT NULL DEFAULT '{}',
    "migrated" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentState_pkey" PRIMARY KEY ("studentId")
);

-- CreateTable
CREATE TABLE "UnitProgress" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "unitId" INTEGER NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UnitProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionAttempt" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "questionId" INTEGER NOT NULL,
    "selectedIndex" INTEGER NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "answeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuestionAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Exam" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "durationMin" INTEGER NOT NULL DEFAULT 120,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Exam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamQuestion" (
    "id" SERIAL NOT NULL,
    "examId" INTEGER NOT NULL,
    "section" "ExamSection" NOT NULL,
    "order" INTEGER NOT NULL,
    "sourceQuestionId" INTEGER,
    "text" TEXT NOT NULL,
    "opts" JSONB NOT NULL,
    "correctIndex" INTEGER NOT NULL,
    "explanation" TEXT,
    "audioUrl" TEXT,
    "audioAssetId" INTEGER,
    "imgUrl" TEXT,
    "passageText" TEXT,

    CONSTRAINT "ExamQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamAttempt" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "examId" INTEGER,
    "preset" TEXT,
    "score" INTEGER NOT NULL,
    "total" INTEGER NOT NULL,
    "sectionScores" JSONB NOT NULL DEFAULT '{}',
    "answers" JSONB NOT NULL DEFAULT '{}',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "ExamAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Unit_track_order_idx" ON "Unit"("track", "order");

-- CreateIndex
CREATE UNIQUE INDEX "Unit_track_legacyId_key" ON "Unit"("track", "legacyId");

-- CreateIndex
CREATE INDEX "Strategy_unitId_order_idx" ON "Strategy"("unitId", "order");

-- CreateIndex
CREATE INDEX "Question_unitId_source_order_idx" ON "Question"("unitId", "source", "order");

-- CreateIndex
CREATE INDEX "Question_strategyId_order_idx" ON "Question"("strategyId", "order");

-- CreateIndex
CREATE INDEX "Video_unitId_order_idx" ON "Video"("unitId", "order");

-- CreateIndex
CREATE INDEX "VocabCategory_unitId_order_idx" ON "VocabCategory"("unitId", "order");

-- CreateIndex
CREATE INDEX "VocabWord_categoryId_order_idx" ON "VocabWord"("categoryId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "MediaAsset_filename_key" ON "MediaAsset"("filename");

-- CreateIndex
CREATE UNIQUE INDEX "MediaAsset_sha256_key" ON "MediaAsset"("sha256");

-- CreateIndex
CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Student_email_key" ON "Student"("email");

-- CreateIndex
CREATE INDEX "Student_lastActiveAt_idx" ON "Student"("lastActiveAt");

-- CreateIndex
CREATE INDEX "UnitProgress_unitId_idx" ON "UnitProgress"("unitId");

-- CreateIndex
CREATE UNIQUE INDEX "UnitProgress_studentId_unitId_key" ON "UnitProgress"("studentId", "unitId");

-- CreateIndex
CREATE INDEX "QuestionAttempt_questionId_isCorrect_idx" ON "QuestionAttempt"("questionId", "isCorrect");

-- CreateIndex
CREATE INDEX "QuestionAttempt_studentId_answeredAt_idx" ON "QuestionAttempt"("studentId", "answeredAt");

-- CreateIndex
CREATE INDEX "Exam_published_order_idx" ON "Exam"("published", "order");

-- CreateIndex
CREATE INDEX "ExamQuestion_examId_section_order_idx" ON "ExamQuestion"("examId", "section", "order");

-- CreateIndex
CREATE INDEX "ExamAttempt_studentId_finishedAt_idx" ON "ExamAttempt"("studentId", "finishedAt");

-- CreateIndex
CREATE INDEX "ExamAttempt_examId_idx" ON "ExamAttempt"("examId");

-- AddForeignKey
ALTER TABLE "Strategy" ADD CONSTRAINT "Strategy_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_strategyId_fkey" FOREIGN KEY ("strategyId") REFERENCES "Strategy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_audioAssetId_fkey" FOREIGN KEY ("audioAssetId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Video" ADD CONSTRAINT "Video_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VocabCategory" ADD CONSTRAINT "VocabCategory_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VocabWord" ADD CONSTRAINT "VocabWord_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "VocabCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentState" ADD CONSTRAINT "StudentState_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnitProgress" ADD CONSTRAINT "UnitProgress_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnitProgress" ADD CONSTRAINT "UnitProgress_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionAttempt" ADD CONSTRAINT "QuestionAttempt_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionAttempt" ADD CONSTRAINT "QuestionAttempt_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamQuestion" ADD CONSTRAINT "ExamQuestion_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamQuestion" ADD CONSTRAINT "ExamQuestion_audioAssetId_fkey" FOREIGN KEY ("audioAssetId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamAttempt" ADD CONSTRAINT "ExamAttempt_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamAttempt" ADD CONSTRAINT "ExamAttempt_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE SET NULL ON UPDATE CASCADE;
