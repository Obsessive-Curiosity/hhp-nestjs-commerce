export const redisConfig = {
  cache: {
    host: process.env.REDIS_CACHE_HOST || 'localhost',
    port: parseInt(process.env.REDIS_CACHE_PORT || '6379'),
  },
};
