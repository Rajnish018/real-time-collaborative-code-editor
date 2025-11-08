import { createClient } from "redis";

let redisClient = null;
let isConnecting = false;

export const getRedisClient = async () => {
  if (redisClient && redisClient.isOpen) {
    return redisClient;
  }
  if (isConnecting) {
    await new Promise((resolve) => {
      const interval = setInterval(() => {
        if (redisClient?.isOpen) {
          clearInterval(interval);
          resolve();
        }
      }, 200);
    });
    return redisClient;
  }

  isConnecting = true;

  const { REDIS_HOST, REDIS_PORT, REDIS_PASSWORD } = process.env;

  if (!REDIS_HOST || !REDIS_PORT || !REDIS_PASSWORD) {
    throw new Error("Redis configuration is missing");
  }

  const REDIS_URL = `redis://default:${REDIS_PASSWORD}@${REDIS_HOST}:${REDIS_PORT}`;

  // Create Redis client with built-in reconnect strategy

  redisClient = createClient({
    url: REDIS_URL,
    socket: {
      reconnectStrategy: (retries) => {
        if (retries >= 10) {
          return new Error("Redis reconnection failed after 10 attempts");
        }
        return Math.min(retries * 100, 3000);
      },
      connectTimeout: 80000,
    },
  });

  // Connection Events
  redisClient.on("connect", () => console.log("Redis Connecting..."));
  redisClient.on("ready", () =>
    console.log("Redis Ready and operational.")
  );
  redisClient.on("error", (err) =>
    console.error("Redis Error:", err.message)
  );
  redisClient.on("end", () => console.warn("Redis Connection closed."));

  try {
    await redisClient.connect();
  } catch (err) {
    console.error("Redis Failed to connect:", err.message);
    isConnecting = false;
    throw err;
  }

  isConnecting = false;

  // Graceful shutdown handling
  const gracefulShutdown = async () => {
    if (redisClient?.isOpen) {
      console.log("Redis Closing connection...");
      try {
        await redisClient.quit();
        console.log("Redis Connection closed gracefully.");
      } catch (err) {
        console.error("Redis Error during shutdown:", err.message);
      }
    }
  };

  process.once("SIGINT", gracefulShutdown);
  process.once("SIGTERM", gracefulShutdown);

  return redisClient;
};
