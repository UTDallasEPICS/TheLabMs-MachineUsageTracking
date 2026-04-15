-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Microcontroller" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "api_key" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isAC" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_Microcontroller" ("api_key", "created_at", "id", "name") SELECT "api_key", "created_at", "id", "name" FROM "Microcontroller";
DROP TABLE "Microcontroller";
ALTER TABLE "new_Microcontroller" RENAME TO "Microcontroller";
CREATE UNIQUE INDEX "Microcontroller_api_key_key" ON "Microcontroller"("api_key");
CREATE TABLE "new_SensorData" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "microcontroller_id" INTEGER NOT NULL,
    "machine_state" BOOLEAN NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isAC" BOOLEAN NOT NULL,
    CONSTRAINT "SensorData_microcontroller_id_fkey" FOREIGN KEY ("microcontroller_id") REFERENCES "Microcontroller" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_SensorData" ("id", "machine_state", "microcontroller_id", "timestamp", "isAC") SELECT "id", "machine_state", "microcontroller_id", "timestamp", false FROM "SensorData";
DROP TABLE "SensorData";
ALTER TABLE "new_SensorData" RENAME TO "SensorData";
CREATE INDEX "SensorData_microcontroller_id_timestamp_idx" ON "SensorData"("microcontroller_id", "timestamp");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
