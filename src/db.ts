import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";

// โหลด Environment Variables สำหรับ Local Development
dotenv.config({ path: ".env.local" });
dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn("⚠️ DATABASE_URL is not set. Database operations will fail without a valid connection string.");
}

export const sql = neon(connectionString || "");
