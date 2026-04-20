import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = (process.env.SEED_ADMIN_EMAIL || "admin@pmaiseventos.com").toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD || "pmais123";
  const name = process.env.SEED_ADMIN_NAME || "Admin Pmais";
  const hash = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: { name, password: hash, role: "ADMIN" },
    create: { email, name, password: hash, role: "ADMIN" },
  });
  console.log(`✓ Admin seeded: ${user.email}`);

  const existing = await prisma.event.findFirst({ where: { name: "Radar 2026" } });
  if (!existing) {
    await prisma.event.create({
      data: {
        name: "Radar 2026",
        cliente: "SBD — Sociedade Brasileira de Diabetes",
        produtorNome: "João Henrique",
      },
    });
    console.log("✓ Demo event seeded: Radar 2026");
  } else {
    console.log("• Demo event already present: Radar 2026");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
