-- Make User.rut optional so executives can be created with email+password only
ALTER TABLE "User" ALTER COLUMN "rut" DROP NOT NULL;
