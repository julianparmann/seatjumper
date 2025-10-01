import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
  var prismaConnectionRetries: number | undefined;
}

// Track connection retries
global.prismaConnectionRetries = global.prismaConnectionRetries || 0;

// Configure Prisma with robust error handling
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });
};

// Initialize Prisma client with connection pooling
let prismaInstance: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  prismaInstance = prismaClientSingleton();
} else {
  // In development, use global to prevent multiple instances
  if (!global.prisma) {
    global.prisma = prismaClientSingleton();
  }
  prismaInstance = global.prisma;
}

export const prisma = prismaInstance;

// Health check function
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

// Retry wrapper for database operations
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;

      // Check if it's a connection error
      if (
        error.code === 'P1001' ||
        error.message?.includes('fetch failed') ||
        error.message?.includes('ECONNREFUSED') ||
        error.message?.includes('Cannot fetch data from service')
      ) {
        console.log(`Database operation failed (attempt ${attempt}/${maxRetries}): ${error.message}`);

        if (attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt - 1);
          console.log(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));

          // Try to reconnect before retry
          try {
            await prisma.$connect();
          } catch (connectError) {
            console.error('Reconnection attempt failed:', connectError);
          }
        }
      } else {
        // Not a connection error, don't retry
        throw error;
      }
    }
  }

  throw lastError;
}

// Graceful shutdown
const gracefulShutdown = async () => {
  try {
    await prisma.$disconnect();
    console.log('Database connection closed gracefully');
  } catch (error) {
    console.error('Error during database disconnect:', error);
  }
};

if (typeof process !== 'undefined') {
  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);
}