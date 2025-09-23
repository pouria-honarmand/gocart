import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";

// WebSocket support for Neon serverless
neonConfig.webSocketConstructor = ws;

// Optional: enable fetch for edge runtimes
neonConfig.poolQueryViaFetch = true;

const connectionString = process.env.DATABASE_URL;

// Neon adapter (only for edge runtime)
const adapter = new PrismaNeon({ connectionString });

// ✅ Singleton pattern to prevent too many connections
const globalForPrisma = global;

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient(process.env.NEXT_RUNTIME === "edge" ? { adapter } : {});

// Only assign global in development
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
