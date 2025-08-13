import * as THREE from "three";

interface CacheEntry {
  geometry: THREE.BufferGeometry;
  timestamp: number;
  hitCount: number;
}

export class GeometryCache {
  private cache = new Map<string, CacheEntry>();
  private maxSize: number;
  private ttl: number;

  constructor(maxSize: number = 100, ttl: number = 5 * 60 * 1000) {
    this.maxSize = maxSize;
    this.ttl = ttl;
  }

  get(key: string): THREE.BufferGeometry | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    if (this.isExpired(entry)) {
      this.delete(key);
      return null;
    }
    
    entry.hitCount++;
    return entry.geometry.clone();
  }

  set(key: string, geometry: THREE.BufferGeometry): void {
    if (this.cache.size >= this.maxSize) {
      this.evictLeastUsed();
    }
    
    this.cache.set(key, {
      geometry: geometry.clone(),
      timestamp: Date.now(),
      hitCount: 0,
    });
  }

  getOrCreate(
    key: string,
    createFn: () => THREE.BufferGeometry
  ): THREE.BufferGeometry {
    const cached = this.get(key);
    
    if (cached) {
      return cached;
    }
    
    const geometry = createFn();
    this.set(key, geometry);
    return geometry;
  }

  delete(key: string): boolean {
    const entry = this.cache.get(key);
    
    if (entry) {
      entry.geometry.dispose();
      return this.cache.delete(key);
    }
    
    return false;
  }

  clear(): void {
    this.cache.forEach(entry => entry.geometry.dispose());
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  getStats(): {
    size: number;
    keys: string[];
    totalHits: number;
  } {
    const keys = Array.from(this.cache.keys());
    const totalHits = Array.from(this.cache.values()).reduce(
      (sum, entry) => sum + entry.hitCount,
      0
    );
    
    return {
      size: this.cache.size,
      keys,
      totalHits,
    };
  }

  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > this.ttl;
  }

  private evictLeastUsed(): void {
    let leastUsedKey: string | null = null;
    let minHitCount = Infinity;
    
    this.cache.forEach((entry, key) => {
      if (this.isExpired(entry)) {
        this.delete(key);
      } else if (entry.hitCount < minHitCount) {
        minHitCount = entry.hitCount;
        leastUsedKey = key;
      }
    });
    
    if (leastUsedKey && this.cache.size >= this.maxSize) {
      this.delete(leastUsedKey);
    }
  }

  cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > this.ttl) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => this.delete(key));
  }
}

const defaultCache = new GeometryCache();

export function getCachedGeometry(
  key: string,
  createFn: () => THREE.BufferGeometry
): THREE.BufferGeometry {
  return defaultCache.getOrCreate(key, createFn);
}

export function clearGeometryCache(): void {
  defaultCache.clear();
}

export function getGeometryCacheStats() {
  return defaultCache.getStats();
}

export default defaultCache;