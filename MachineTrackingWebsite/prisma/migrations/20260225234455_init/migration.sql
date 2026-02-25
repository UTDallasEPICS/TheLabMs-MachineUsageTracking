-- CreateEnum
CREATE TYPE "Role" AS ENUM ('admin', 'user');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Microcontroller" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "api_key" INTEGER NOT NULL,
    "battery_level" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Microcontroller_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SensorData" (
    "id" SERIAL NOT NULL,
    "microcontroller_id" INTEGER NOT NULL,
    "machine_state" BOOLEAN NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SensorData_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Microcontroller_api_key_key" ON "Microcontroller"("api_key");

-- CreateIndex
CREATE INDEX "idx_microcontroller_time" ON "SensorData"("microcontroller_id", "timestamp");

-- AddForeignKey
ALTER TABLE "SensorData" ADD CONSTRAINT "SensorData_microcontroller_id_fkey" FOREIGN KEY ("microcontroller_id") REFERENCES "Microcontroller"("id") ON DELETE CASCADE ON UPDATE CASCADE;
