/**
 * Redis Client Service
 * 
 * Provides a Redis connection with graceful fallback.
 * If Redis is unavailable, the application continues to function
 * normally without caching (all cache operations become no-ops).
 * 
 * Environment Variables:
 *   REDIS_URL - Redis connection URL (default: redis://localhost:6379)
 */

const Redis = require('ioredis');

let redisClient = null;
let isRedisConnected = false;

/**
 * Initialize Redis connection with error handling.
 * Does NOT throw if Redis is unavailable — app continues without caching.
 */
function initRedis() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

    try {
        redisClient = new Redis(redisUrl, {
            maxRetriesPerRequest: 3,
            retryStrategy(times) {
                if (times > 3) {
                    console.warn('⚠️  Redis: Max retries reached. Running without cache.');
                    return null; // Stop retrying
                }
                return Math.min(times * 200, 2000); // Exponential backoff
            },
            lazyConnect: true, // Don't connect until first command
            connectTimeout: 5000,
        });

        redisClient.on('connect', () => {
            isRedisConnected = true;
            console.log('✅ Redis connected successfully');
        });

        redisClient.on('error', (err) => {
            isRedisConnected = false;
            console.warn(`⚠️  Redis error: ${err.message}. App continues without cache.`);
        });

        redisClient.on('close', () => {
            isRedisConnected = false;
        });

        // Attempt connection (non-blocking)
        redisClient.connect().catch((err) => {
            isRedisConnected = false;
            console.warn(`⚠️  Redis connection failed: ${err.message}. Running without cache.`);
        });

    } catch (err) {
        console.warn(`⚠️  Redis init failed: ${err.message}. Running without cache.`);
        redisClient = null;
        isRedisConnected = false;
    }
}

/**
 * Get the Redis client instance.
 * @returns {Redis|null} Redis client or null if unavailable
 */
function getRedisClient() {
    return isRedisConnected ? redisClient : null;
}

/**
 * Check if Redis is currently connected.
 * @returns {boolean}
 */
function isConnected() {
    return isRedisConnected;
}

/**
 * Gracefully disconnect Redis.
 */
async function disconnectRedis() {
    if (redisClient) {
        try {
            await redisClient.quit();
            console.log('🔌 Redis disconnected');
        } catch (err) {
            // Ignore disconnect errors
        }
    }
}

module.exports = {
    initRedis,
    getRedisClient,
    isConnected,
    disconnectRedis,
};
