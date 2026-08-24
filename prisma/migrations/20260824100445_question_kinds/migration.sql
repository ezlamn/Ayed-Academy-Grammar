-- CreateEnum
CREATE TYPE "QuestionKind" AS ENUM ('mcq', 'fill', 'order');

-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "answers" JSONB,
ADD COLUMN     "kind" "QuestionKind" NOT NULL DEFAULT 'mcq',
ADD COLUMN     "passageId" TEXT,
ADD COLUMN     "tokens" JSONB,
ALTER COLUMN "opts" DROP NOT NULL,
ALTER COLUMN "correctIndex" DROP NOT NULL;
