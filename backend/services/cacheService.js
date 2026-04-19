/**
 * Cache Service
 * 
 * Provides a high-level caching abstraction over Redis.
 * All operations are safe — they gracefully handle Redis being unavailable.
 * 
 * Features:
 *   - Cache-first strategy (check cache before DB)
 *   - TTL-based expiry (default 60 seconds)
 *   - Pattern-based cache invalidation
 *   - HIT/MISS logging for monitoring
 */

const { getRedisClient } = require('./redisClient');

const DEFAULT_TTL = 60; // seconds

/**
 * Get data from cache.
 * Logs HIT or MISS for monitoring.
 * 
 * @param {string} key - Cache key
 * @returns {Object|null} Parsed cached data, or null if not found/unavailable
 */
async function getCache(key) {
    try {
        const client = getRedisClient();
        if (!client) return null;

        const data = await client.get(key);
        if (data) {
            console.log(`🟢 CACHE HIT: ${key}`);
            return JSON.parse(data);
        }

        console.log(`🔴 CACHE MISS: ${key}`);
        return null;
    } catch (err) {
        console.warn(`⚠️  Cache GET error for key "${key}": ${err.message}`);
        return null;
    }
}

/**
 * Store data in cache with TTL.
 * 
 * @param {string} key - Cache key
 * @param {*} data - Data to cache (will be JSON.stringify'd)
 * @param {number} [ttl=60] - Time to live in seconds
 */
async function setCache(key, data, ttl = DEFAULT_TTL) {
    try {
        const client = getRedisClient();
        if (!client) return;

        await client.setex(key, ttl, JSON.stringify(data));
        console.log(`💾 CACHE SET: ${key} (TTL: ${ttl}s)`);
    } catch (err) {
        console.warn(`⚠️  Cache SET error for key "${key}": ${err.message}`);
    }
}

/**
 * Invalidate (delete) cache entries matching a pattern.
 * Uses Redis SCAN for safe pattern-based deletion.
 * 
 * @param {string} pattern - Key pattern to match (e.g., "listings:*")
 */
async function invalidateCache(pattern) {
    try {
        const client = getRedisClient();
        if (!client) return;

        let cursor = '0';
        let deletedCount = 0;

        do {
            const [newCursor, keys] = await client.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
            cursor = newCursor;

            if (keys.length > 0) {
                await client.del(...keys);
                deletedCount += keys.length;
            }
        } while (cursor !== '0');

        if (deletedCount > 0) {
            console.log(`🗑️  CACHE INVALIDATED: ${pattern} (${deletedCount} keys)`);
        }
    } catch (err) {
        console.warn(`⚠️  Cache INVALIDATE error for pattern "${pattern}": ${err.message}`);
    }
}

/**
 * Delete a specific cache key.
 * 
 * @param {string} key - Exact cache key to delete
 */
async function deleteCache(key) {
    try {
        const client = getRedisClient();
        if (!client) return;

        await client.del(key);
        console.log(`🗑️  CACHE DELETED: ${key}`);
    } catch (err) {
        console.warn(`⚠️  Cache DELETE error for key "${key}": ${err.message}`);
    }
}

/**
 * Generate a deterministic cache key from query parameters.
 * 
 * @param {string} prefix - Key prefix (e.g., "listings")
 * @param {Object} params - Query parameters
 * @returns {string} Cache key
 */
function buildCacheKey(prefix, params = {}) {
    const sortedParams = Object.keys(params)
        .sort()
        .filter(k => params[k] !== undefined && params[k] !== null && params[k] !== '')
        .map(k => `${k}=${params[k]}`)
        .join('&');

    return sortedParams ? `${prefix}:${sortedParams}` : `${prefix}:all`;
}

module.exports = {
    getCache,
    setCache,
    invalidateCache,
    deleteCache,
    buildCacheKey,
    DEFAULT_TTL,
};
