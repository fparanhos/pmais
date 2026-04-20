import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";

// Apaga TODOS os eventos (cascade remove expenseCategory, expenseItem,
// supplier, revenueItem, task, checklist, checklistItem).
// Usuários/admin são preservados.

async function main() {
  const prisma = new PrismaClient();
  const list = await prisma.event.findMany({
    select: { id: true, name: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  if (list.length === 0) {
    console.log("Nenhum evento no banco — nada a remover.");
    await prisma.$disconnect();
    return;
  }

  console.log(`Encontrados ${list.length} evento(s):`);
  for (const e of list) console.log(`  - ${e.name} (${e.id})`);

  const r = await prisma.event.deleteMany({});
  console.log(`\n✓ ${r.count} evento(s) removido(s). Cascata apagou categorias, itens, fornecedores, receitas, tarefas e checklists.`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
