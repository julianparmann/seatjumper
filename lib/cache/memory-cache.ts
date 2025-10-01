// Simple in-memory cache with TTL
class MemoryCache {
  private cache: Map<string, { data: any; expiry: number }> = new Map();

  set(key: string, value: any, ttlSeconds: number = 60) {
    const expiry = Date.now() + (ttlSeconds * 1000);
    this.cache.set(key, { data: value, expiry });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);

    if (!item) {
      return null;
    }

    // Check if expired
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  delete(key: string) {
    this.cache.delete(key);
  }

  // Clear entries for a specific pattern
  clearPattern(pattern: string) {
    const keys = Array.from(this.cache.keys());
    keys.forEach(key => {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    });
  }

  clear() {
    this.cache.clear();
  }

  // Clean up expired entries
  cleanup() {
    const now = Date.now();
    const keys = Array.from(this.cache.keys());
    keys.forEach(key => {
      const item = this.cache.get(key);
      if (item && now > item.expiry) {
        this.cache.delete(key);
      }
    });
  }
}

// Singleton instance
export const cache = new MemoryCache();

// Run cleanup every 5 minutes
if (typeof process !== 'undefined') {
  setInterval(() => {
    cache.cleanup();
  }, 5 * 60 * 1000);
}