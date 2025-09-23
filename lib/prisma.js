import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";

// ✅ Configure WebSocket for Neon
neonConfig.webSocketConstructor = ws;

// ✅ Enable querying via fetch for Edge runtimes
neonConfig.poolQueryViaFetch = true;

const connectionString = process.env.DATABASE_URL;
const adapter = new PrismaNeon({ connectionString });

// ✅ Singleton pattern to prevent multiple connections
const globalForPrisma = global;

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient(process.env.NEXT_RUNTIME === "edge" ? { adapter } : {});

if (process.env.NEXT_RUNTIME !== "edge") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
