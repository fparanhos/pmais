import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";

async function main() {
  const p = new PrismaClient();
  const u = await p.user.findUnique({
    where: { email: "admin@pmaiseventos.com" },
  });
  console.log(u ? `OK ${u.email} (${u.role})` : "NOT FOUND");
  await p.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
