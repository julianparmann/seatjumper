import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import os from 'os';

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Memory usage information
    const memoryUsage = process.memoryUsage();
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;

    // Convert bytes to MB for readability
    const toMB = (bytes: number) => Math.round(bytes / 1024 / 1024);

    // Database health check
    let dbHealthy = true;
    let dbResponseTime = 0;

    try {
      const dbStart = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      dbResponseTime = Date.now() - dbStart;
    } catch (error) {
      dbHealthy = false;
      console.error('Database health check failed:', error);
    }

    // System load average (Unix systems only)
    const loadAverage = os.loadavg();

    // Calculate health status
    const heapUsedPercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
    const systemMemoryPercent = (usedMemory / totalMemory) * 100;

    // Determine overall health status
    let status = 'healthy';
    const warnings = [];

    if (!dbHealthy) {
      status = 'unhealthy';
      warnings.push('Database connection failed');
    }

    if (heapUsedPercent > 90) {
      status = 'critical';
      warnings.push('Heap memory usage critical (>90%)');
    } else if (heapUsedPercent > 75) {
      status = status === 'unhealthy' ? 'unhealthy' : 'warning';
      warnings.push('Heap memory usage high (>75%)');
    }

    if (systemMemoryPercent > 90) {
      status = status === 'healthy' ? 'warning' : status;
      warnings.push('System memory usage high (>90%)');
    }

    const responseTime = Date.now() - startTime;

    const healthData = {
      status,
      timestamp: new Date().toISOString(),
      uptime: Math.round(process.uptime()),
      responseTime: `${responseTime}ms`,
      warnings,
      memory: {
        heap: {
          used: toMB(memoryUsage.heapUsed),
          total: toMB(memoryUsage.heapTotal),
          usedPercent: Math.round(heapUsedPercent),
          limit: process.env.NODE_OPTIONS?.includes('max-old-space-size')
            ? parseInt(process.env.NODE_OPTIONS.match(/max-old-space-size=(\d+)/)?.[1] || '0')
            : 'default',
        },
        rss: toMB(memoryUsage.rss),
        external: toMB(memoryUsage.external),
        system: {
          used: toMB(usedMemory),
          total: toMB(totalMemory),
          free: toMB(freeMemory),
          usedPercent: Math.round(systemMemoryPercent),
        },
      },
      database: {
        connected: dbHealthy,
        responseTime: dbHealthy ? `${dbResponseTime}ms` : null,
      },
      system: {
        platform: os.platform(),
        nodeVersion: process.version,
        cpus: os.cpus().length,
        loadAverage: {
          '1min': loadAverage[0].toFixed(2),
          '5min': loadAverage[1].toFixed(2),
          '15min': loadAverage[2].toFixed(2),
        },
      },
      environment: {
        nodeEnv: process.env.NODE_ENV || 'development',
        port: process.env.PORT || '3000',
      },
    };

    // Set appropriate status code based on health
    const statusCode = status === 'healthy' ? 200 : status === 'warning' ? 200 : 503;

    return NextResponse.json(healthData, { status: statusCode });
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: 'Health check failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Lightweight health check for load balancers
export async function HEAD(request: NextRequest) {
  try {
    // Quick database connectivity check
    await prisma.$queryRaw`SELECT 1`;
    return new NextResponse(null, { status: 200 });
  } catch (error) {
    return new NextResponse(null, { status: 503 });
  }
}