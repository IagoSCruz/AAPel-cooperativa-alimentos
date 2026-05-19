/**
 * Create or reset the bootstrap ADMIN user (non-destructive — does not wipe catalog).
 *
 * Usage:
 *   ADMIN_EMAIL=admin@aapel.com.br ADMIN_PASSWORD='sua-senha' pnpm db:create-admin
 */

import "dotenv/config";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "./client";
import * as s from "./schema";

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL ?? "admin@aapel.com.br").trim().toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "changeme";
const ADMIN_NAME = process.env.ADMIN_NAME ?? "Admin AAPel";
const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS ?? 12);

async function main() {
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, BCRYPT_ROUNDS);

  const existing = await db
    .select()
    .from(s.users)
    .where(eq(s.users.email, ADMIN_EMAIL))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(s.users)
      .set({
        name: ADMIN_NAME,
        passwordHash,
        role: "ADMIN",
        deletedAt: null,
      })
      .where(eq(s.users.email, ADMIN_EMAIL));
    console.log(`✅ Admin atualizado: ${ADMIN_EMAIL}`);
  } else {
    await db.insert(s.users).values({
      email: ADMIN_EMAIL,
      name: ADMIN_NAME,
      passwordHash,
      role: "ADMIN",
      consentMarketing: false,
      consentAnalytics: false,
    });
    console.log(`✅ Admin criado: ${ADMIN_EMAIL}`);
  }

  console.log(`   Login em /admin/login com a senha definida em ADMIN_PASSWORD.`);
}

main()
  .catch((err) => {
    console.error("❌ Falha:", err);
    process.exit(1);
  })
  .finally(() => process.exit(0));
