import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// WebSocket support for Neon serverless
neonConfig.webSocketConstructor = ws;

// Enable fetch for edge runtimes (Cloudflare, Vercel Edge, etc.)
neonConfig.poolQueryViaFetch = true;

const connectionString = process.env.DATABASE_URL;

// Neon adapter for edge runtime
const adapter = new PrismaNeon({ connectionString });

// Global singleton pattern to prevent multiple instances
const globalForPrisma = global;
const prisma =
  globalForPrisma.prisma ||
  new PrismaClient(process.env.NEXT_RUNTIME === 'edge' ? { adapter } : {});

if (process.env.NEXT_RUNTIME !== 'edge') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
