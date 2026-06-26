import { NextResponse } from 'next/server';
import { aiScheduler, type HealthStatus } from '@/lib/ai/scheduler';

export async function GET() {
  try {
    const healthStatusMap = aiScheduler.getHealthStatus();
    const stats = aiScheduler.getStats();

    const providers: HealthStatus[] = [];

    healthStatusMap.forEach((status, _provider) => {
      providers.push(status);
    });

    // If no health checks have run yet, return default status
    if (providers.length === 0) {
      const defaultProviders = [
        { provider: 'kimi', healthy: true, latencyMs: 0, lastCheck: Date.now(), consecutiveFailures: 0 },
        { provider: 'doubao', healthy: true, latencyMs: 0, lastCheck: Date.now(), consecutiveFailures: 0 },
        { provider: 'qwen', healthy: true, latencyMs: 0, lastCheck: Date.now(), consecutiveFailures: 0 },
        { provider: 'zhipu', healthy: true, latencyMs: 0, lastCheck: Date.now(), consecutiveFailures: 0 },
        { provider: 'gpt4o', healthy: true, latencyMs: 0, lastCheck: Date.now(), consecutiveFailures: 0 },
        { provider: 'claude', healthy: true, latencyMs: 0, lastCheck: Date.now(), consecutiveFailures: 0 },
        { provider: 'pika', healthy: true, latencyMs: 0, lastCheck: Date.now(), consecutiveFailures: 0 },
        { provider: 'sora', healthy: true, latencyMs: 0, lastCheck: Date.now(), consecutiveFailures: 0 },
      ];
      return NextResponse.json({
        status: 'ok',
        providers: defaultProviders,
        stats: {
          totalRequests: 0,
          chineseRequests: 0,
          globalRequests: 0,
        },
      });
    }

    const healthyCount = providers.filter((p) => p.healthy).length;
    const overallHealthy = healthyCount > 0;

    return NextResponse.json({
      status: overallHealthy ? 'ok' : 'degraded',
      providers,
      stats,
      summary: {
        total: providers.length,
        healthy: healthyCount,
        unhealthy: providers.length - healthyCount,
      },
    });
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      { status: 'error', error: 'Health check failed' },
      { status: 500 }
    );
  }
}
