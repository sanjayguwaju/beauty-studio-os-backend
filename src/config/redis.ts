import IORedis from "ioredis";
import { env } from "./env";
import logger from "./logger";

export const redis = env.REDIS_URL
  ? new IORedis(env.REDIS_URL, { 
      maxRetriesPerRequest: null, 
      lazyConnect: true,
      family: 0, // Upstash recommended IPv4/IPv6 support
      tls: env.REDIS_URL.startsWith('rediss://') ? { rejectUnauthorized: false } : undefined
    })
  : new IORedis({
      host: env.REDIS_HOST,
      port: env.REDIS_PORT,
      username: env.REDIS_USERNAME,
      password: env.REDIS_PASSWORD,
      maxRetriesPerRequest: null,
      lazyConnect: true,
      tls: env.REDIS_HOST && env.REDIS_HOST !== '127.0.0.1' && env.REDIS_HOST !== 'localhost' ? {} : undefined
    });

redis.on("connect", () => logger.info("Redis connected"));
redis.on("error", (err) => logger.warn("Redis unavailable (non-fatal):", err.message));
