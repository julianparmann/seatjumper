'use client';

import { useEffect, useState } from 'react';
import { Activity, AlertCircle, AlertTriangle, CheckCircle, Database, HardDrive, Cpu, Clock, RefreshCw } from 'lucide-react';

interface HealthData {
  status: string;
  timestamp: string;
  uptime: number;
  responseTime: string;
  warnings: string[];
  memory: {
    heap: {
      used: number;
      total: number;
      usedPercent: number;
      limit: string | number;
    };
    rss: number;
    external: number;
    system: {
      used: number;
      total: number;
      free: number;
      usedPercent: number;
    };
  };
  database: {
    connected: boolean;
    responseTime: string | null;
  };
  system: {
    platform: string;
    nodeVersion: string;
    cpus: number;
    loadAverage: {
      '1min': string;
      '5min': string;
      '15min': string;
    };
  };
  environment: {
    nodeEnv: string;
    port: string;
  };
}

export default function HealthMonitor() {
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5000); // 5 seconds default

  const fetchHealth = async () => {
    try {
      const response = await fetch('/api/health');
      if (!response.ok) {
        throw new Error(`Health check failed: ${response.statusText}`);
      }
      const data = await response.json();
      setHealthData(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch health data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();

    if (autoRefresh) {
      const interval = setInterval(fetchHealth, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-6 h-6 text-yellow-500" />;
      case 'critical':
      case 'unhealthy':
        return <AlertCircle className="w-6 h-6 text-red-500" />;
      default:
        return <Activity className="w-6 h-6 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'critical':
      case 'unhealthy':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getMemoryBarColor = (percent: number) => {
    if (percent > 90) return 'bg-red-500';
    if (percent > 75) return 'bg-yellow-500';
    if (percent > 50) return 'bg-blue-500';
    return 'bg-green-500';
  };

  if (loading && !healthData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-gray-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">System Health Monitor</h1>
        <p className="text-gray-600">Real-time monitoring of application health and performance</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-4">
          <p className="font-semibold">Error:</p>
          <p>{error}</p>
        </div>
      )}

      {healthData && (
        <>
          {/* Status Header */}
          <div className={`border-2 rounded-lg p-6 mb-6 ${getStatusColor(healthData.status)}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getStatusIcon(healthData.status)}
                <div>
                  <h2 className="text-2xl font-bold capitalize">{healthData.status}</h2>
                  <p className="text-sm opacity-75">
                    Last updated: {new Date(healthData.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium">Auto-refresh:</label>
                  <input
                    type="checkbox"
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                    className="rounded"
                  />
                </div>
                <select
                  value={refreshInterval}
                  onChange={(e) => setRefreshInterval(Number(e.target.value))}
                  className="px-3 py-1 border rounded text-sm"
                  disabled={!autoRefresh}
                >
                  <option value={2000}>2s</option>
                  <option value={5000}>5s</option>
                  <option value={10000}>10s</option>
                  <option value={30000}>30s</option>
                  <option value={60000}>1m</option>
                </select>
                <button
                  onClick={fetchHealth}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center space-x-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {healthData.warnings.length > 0 && (
              <div className="mt-4 space-y-1">
                {healthData.warnings.map((warning, index) => (
                  <div key={index} className="flex items-center space-x-2 text-sm">
                    <AlertTriangle className="w-4 h-4" />
                    <span>{warning}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {/* Uptime Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Uptime</h3>
                <Clock className="w-5 h-5 text-gray-400" />
              </div>
              <p className="text-2xl font-bold">{formatUptime(healthData.uptime)}</p>
              <p className="text-sm text-gray-500 mt-1">Response time: {healthData.responseTime}</p>
            </div>

            {/* Database Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Database</h3>
                <Database className="w-5 h-5 text-gray-400" />
              </div>
              <div className="flex items-center space-x-2">
                {healthData.database.connected ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-500" />
                )}
                <span className={healthData.database.connected ? 'text-green-600' : 'text-red-600'}>
                  {healthData.database.connected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              {healthData.database.responseTime && (
                <p className="text-sm text-gray-500 mt-1">
                  Response time: {healthData.database.responseTime}
                </p>
              )}
            </div>

            {/* System Info Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">System</h3>
                <Cpu className="w-5 h-5 text-gray-400" />
              </div>
              <div className="space-y-1 text-sm">
                <p>Platform: {healthData.system.platform}</p>
                <p>Node: {healthData.system.nodeVersion}</p>
                <p>CPUs: {healthData.system.cpus}</p>
                <p>Environment: {healthData.environment.nodeEnv}</p>
              </div>
            </div>
          </div>

          {/* Memory Usage */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Heap Memory */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Heap Memory</h3>
                <HardDrive className="w-5 h-5 text-gray-400" />
              </div>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Used: {healthData.memory.heap.used} MB</span>
                    <span>{healthData.memory.heap.usedPercent}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all ${getMemoryBarColor(healthData.memory.heap.usedPercent)}`}
                      style={{ width: `${healthData.memory.heap.usedPercent}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Total: {healthData.memory.heap.total} MB</span>
                    <span>Limit: {healthData.memory.heap.limit} MB</span>
                  </div>
                </div>
                <div className="pt-2 border-t">
                  <p className="text-sm text-gray-600">
                    RSS: {healthData.memory.rss} MB | External: {healthData.memory.external} MB
                  </p>
                </div>
              </div>
            </div>

            {/* System Memory */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">System Memory</h3>
                <HardDrive className="w-5 h-5 text-gray-400" />
              </div>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Used: {healthData.memory.system.used} MB</span>
                    <span>{healthData.memory.system.usedPercent}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all ${getMemoryBarColor(healthData.memory.system.usedPercent)}`}
                      style={{ width: `${healthData.memory.system.usedPercent}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Total: {healthData.memory.system.total} MB</span>
                    <span>Free: {healthData.memory.system.free} MB</span>
                  </div>
                </div>
                <div className="pt-2 border-t">
                  <p className="text-sm text-gray-600">
                    Load Average: {healthData.system.loadAverage['1min']} / {healthData.system.loadAverage['5min']} / {healthData.system.loadAverage['15min']}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Memory Usage Chart (Text-based) */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Memory Distribution</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {healthData.memory.heap.used}
                </div>
                <div className="text-sm text-gray-600">Heap Used (MB)</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {healthData.memory.heap.total - healthData.memory.heap.used}
                </div>
                <div className="text-sm text-gray-600">Heap Free (MB)</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {healthData.memory.rss}
                </div>
                <div className="text-sm text-gray-600">RSS (MB)</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {healthData.memory.external}
                </div>
                <div className="text-sm text-gray-600">External (MB)</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}