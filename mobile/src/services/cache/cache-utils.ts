export interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export function isCacheValid<T>(cached: CacheEntry<T> | undefined, ttl: number): boolean {
  if (!cached) return false;
  const age = Date.now() - cached.timestamp;
  return age < ttl;
}

export function createCacheEntry<T>(data: T): CacheEntry<T> {
  return {
    data,
    timestamp: Date.now(),
  };
}

export class CacheManager<T> {
  private cache = new Map<string, CacheEntry<T>>();

  constructor(private readonly ttl: number) {}

  set(key: string, data: T): void {
    this.cache.set(key, createCacheEntry(data));
  }

  get(key: string): T | null {
    const cached = this.cache.get(key);
    if (isCacheValid(cached, this.ttl)) {
      return cached!.data;
    }
    this.cache.delete(key);
    return null;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  clear(key?: string): void {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  size(): number {
    return this.cache.size;
  }

  keys(): IterableIterator<string> {
    return this.cache.keys();
  }
}
