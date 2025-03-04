-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Bot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'dca',
    "status" TEXT NOT NULL DEFAULT 'stopped',
    "config" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Bot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Bot" ("config", "createdAt", "id", "name", "status", "type", "updatedAt", "userId") SELECT "config", "createdAt", "id", "name", "status", "type", "updatedAt", "userId" FROM "Bot";
DROP TABLE "Bot";
ALTER TABLE "new_Bot" RENAME TO "Bot";
CREATE INDEX "Bot_userId_idx" ON "Bot"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
