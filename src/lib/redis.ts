import Redis from 'ioredis'

// 仅在服务器环境中创建Redis客户端，不在Edge运行时创建
let redis: Redis | null = null;

// 检查是否在Node.js环境中（不是Edge运行时）
const isNodeEnvironment = typeof process !== 'undefined' && 
  process.versions != null && 
  process.versions.node != null;

if (isNodeEnvironment) {
  try {
    redis = new Redis(process.env.REDIS_URL || '');
  } catch (error) {
    console.error('Failed to initialize Redis client:', error);
    redis = null;
  }
}

// 生成缓存key
export function generateCacheKey(prefix: string, identifier: string | object): string {
  if (typeof identifier === 'string') {
    return `${prefix}:${identifier}`
  } else {
    return `${prefix}:${JSON.stringify(identifier)}`
  }
}

// 从缓存中获取数据
export async function getCache<T>(key: string): Promise<T | null> {
  if (!redis) return null;
  
  try {
    const data = await redis.get(key)
    if (data) {
      return JSON.parse(data) as T
    }
    return null
  } catch (error) {
    console.error('Redis get error:', error)
    return null
  }
}

// 在缓存中设置数据，并设置TTL
export async function setCache<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
  if (!redis) return;
  
  try {
    await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds)
  } catch (error) {
    console.error('Redis set error:', error)
  }
}

// 从缓存中删除数据
export async function deleteCache(key: string): Promise<void> {
  if (!redis) return;
  
  try {
    await redis.del(key)
  } catch (error) {
    console.error('Redis delete error:', error)
  }
}

// 按模式清除缓存
export async function deleteCachePattern(pattern: string): Promise<void> {
  if (!redis) return;
  
  try {
    const keys = await redis.keys(pattern)
    if (keys.length > 0) {
      await redis.del(...keys)
    }
  } catch (error) {
    console.error('Redis clear cache error:', error)
  }
}

export default redis; 