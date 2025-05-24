/* eslint-disable @typescript-eslint/no-explicit-any */
import Redis from 'ioredis';
import { createHash } from 'crypto';

const DEFAULT_TTL = parseInt(process.env.CACHE_TTL || '86400', 10);

const USE_REDIS = process.env.USE_REDIS_CACHE === 'true';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

const memoryCache = new Map<string, { value: any; expiry: number }>();

let redisClient: Redis | null = null;

if (USE_REDIS) {
  try {
    redisClient = new Redis(REDIS_URL);
    console.log('Redis cache initialized');

    redisClient.on('error', (error) => {
      console.error('Redis error:', error);
    });
  } catch (error) {
    console.error('Failed to initialize Redis:', error);
  }
}

export function generateCacheKey(input: any): string {
  const stringified = typeof input === 'string' ? input : JSON.stringify(input);
  return createHash('md5').update(stringified).digest('hex');
}

export async function setCacheValue(key: string, value: any, ttl: number = DEFAULT_TTL): Promise<void> {
  if (USE_REDIS && redisClient) {
    try {
      await redisClient.set(key, JSON.stringify(value), 'EX', ttl);
    } catch (error) {
      console.error('Redis set error:', error);
      memoryCache.set(key, { value, expiry: Date.now() + ttl * 1000 });
    }
  } else {
    memoryCache.set(key, { value, expiry: Date.now() + ttl * 1000 });
  }
}

export async function getCacheValue<T>(key: string): Promise<T | null> {
  if (USE_REDIS && redisClient) {
    try {
      const value = await redisClient.get(key);
      if (!value) return null;
      return JSON.parse(value) as T;
    } catch (error) {
      console.error('Redis get error:', error);
      const cachedItem = memoryCache.get(key);
      if (!cachedItem || cachedItem.expiry < Date.now()) {
        memoryCache.delete(key);
        return null;
      }
      return cachedItem.value as T;
    }
  } else {
    const cachedItem = memoryCache.get(key);
    if (!cachedItem || cachedItem.expiry < Date.now()) {
      memoryCache.delete(key);
      return null;
    }
    return cachedItem.value as T;
  }
}

export async function clearCache(keyPattern?: string): Promise<void> {
  if (USE_REDIS && redisClient) {
    try {
      if (keyPattern) {
        const keys = await redisClient.keys(keyPattern);
        if (keys.length > 0) {
          await redisClient.del(...keys);
        }
      } else {
        await redisClient.flushdb();
      }
    } catch (error) {
      console.error('Redis clear error:', error);
    }
  } else {
    if (keyPattern) {
      const regex = new RegExp(keyPattern.replace('*', '.*'));
      for (const key of memoryCache.keys()) {
        if (regex.test(key)) {
          memoryCache.delete(key);
        }
      }
    } else {
      memoryCache.clear();
    }
  }
}