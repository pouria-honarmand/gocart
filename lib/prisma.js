import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";

// WebSocket support for Neon serverless
neonConfig.webSocketConstructor = ws;

// Optional: enable fetch for edge runtimes
neonConfig.poolQueryViaFetch = true;

const connectionString = process.env.DATABASE_URL!;

// Neon adapter (only for edge runtime)
const adapter = new PrismaNeon({ connectionString });

// Global type fix
const globalForPrisma = global as unknown as { prisma?: PrismaClient };

// ✅ Singleton pattern to prevent too many connections
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient(
    process.env.NEXT_RUNTIME === "edge" ? { adapter } : {}
  );

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
