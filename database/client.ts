/**
 * Drizzle client — used by Next.js BFF and seed scripts.
 *
 * Note: FastAPI uses its own SQLAlchemy connection pool (backend/app/database.py).
 * This client is only for TypeScript-side code (BFF, migrations, seed).
 */

import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set. See .env.example.");
}

const queryClient = postgres(process.env.DATABASE_URL, {
  max: 10,
  idle_timeout: 20,
});

export const db = drizzle(queryClient, { schema, casing: "snake_case" });
export { schema };
export type Database = typeof db;
