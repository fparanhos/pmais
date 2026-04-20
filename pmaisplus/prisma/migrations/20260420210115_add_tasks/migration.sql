-- AlterTable
ALTER TABLE "Event" ADD COLUMN "emailFinanceiro" TEXT;
ALTER TABLE "Event" ADD COLUMN "emailProdutor" TEXT;
ALTER TABLE "Event" ADD COLUMN "trelloBoardId" TEXT;
ALTER TABLE "Event" ADD COLUMN "trelloBoardName" TEXT;
ALTER TABLE "Event" ADD COLUMN "trelloBoardUrl" TEXT;

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "trelloCardId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "listName" TEXT NOT NULL,
    "listOrder" INTEGER NOT NULL DEFAULT 0,
    "position" REAL NOT NULL DEFAULT 0,
    "labels" TEXT,
    "dueDate" DATETIME,
    "closed" BOOLEAN NOT NULL DEFAULT false,
    "expenseItemId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Task_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Task_expenseItemId_fkey" FOREIGN KEY ("expenseItemId") REFERENCES "ExpenseItem" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Checklist" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "taskId" TEXT NOT NULL,
    "trelloId" TEXT,
    "name" TEXT NOT NULL,
    "position" REAL NOT NULL DEFAULT 0,
    CONSTRAINT "Checklist_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ChecklistItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "checklistId" TEXT NOT NULL,
    "trelloId" TEXT,
    "text" TEXT NOT NULL,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "position" REAL NOT NULL DEFAULT 0,
    CONSTRAINT "ChecklistItem_checklistId_fkey" FOREIGN KEY ("checklistId") REFERENCES "Checklist" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Task_trelloCardId_key" ON "Task"("trelloCardId");

-- CreateIndex
CREATE INDEX "Task_eventId_listName_position_idx" ON "Task"("eventId", "listName", "position");

-- CreateIndex
CREATE INDEX "Task_expenseItemId_idx" ON "Task"("expenseItemId");

-- CreateIndex
CREATE UNIQUE INDEX "Checklist_trelloId_key" ON "Checklist"("trelloId");

-- CreateIndex
CREATE INDEX "Checklist_taskId_idx" ON "Checklist"("taskId");

-- CreateIndex
CREATE UNIQUE INDEX "ChecklistItem_trelloId_key" ON "ChecklistItem"("trelloId");

-- CreateIndex
CREATE INDEX "ChecklistItem_checklistId_idx" ON "ChecklistItem"("checklistId");
