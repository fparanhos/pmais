import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";

// Idempotente — cria/atualiza o admin demo a partir de SEED_ADMIN_* do ambiente.
// Não popula evento/categorias (use `npm run db:seed:demo` apenas em dev).

async function main() {
  const email = (process.env.SEED_ADMIN_EMAIL || "admin@pmaiseventos.com")
    .toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD || "pmais123";
  const name = process.env.SEED_ADMIN_NAME || "Admin Pmais";
  const hash = await bcrypt.hash(password, 10);

  const prisma = new PrismaClient();
  const user = await prisma.user.upsert({
    where: { email },
    update: { name, password: hash, role: "ADMIN" },
    create: { email, name, password: hash, role: "ADMIN" },
  });
  console.log(`[seed-admin] ok: ${user.email}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
