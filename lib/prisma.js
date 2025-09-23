import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";

neonConfig.webSocketConstructor = ws;
neonConfig.poolQueryViaFetch = true;

const connectionString = process.env.DATABASE_URL;

// Neon adapter for edge
const adapter = new PrismaNeon({ connectionString });

// Global singleton
const globalForPrisma = global;
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient(process.env.NEXT_RUNTIME === "edge" ? { adapter } : {});

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
