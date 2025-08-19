DROP INDEX "projectSchema_projectId_version_index";
ALTER TABLE "projectSchema" ALTER COLUMN "isActive" SET DEFAULT false;
ALTER TABLE "projectSchema" ADD COLUMN "message" text;
ALTER TABLE "projectSchema" DROP COLUMN "name";
ALTER TABLE "projectSchema" DROP COLUMN "description";
ALTER TABLE "projectSchema" DROP COLUMN "schemaType";