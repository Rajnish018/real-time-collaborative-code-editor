import dotenv from "dotenv";
import { createServer } from "http";
import next from "next";
import { getRedisClient } from "./src/lib/redisClient.js";
import { startSocketServer, stopSocketServer } from "./src/lib/socket.js";

dotenv.config();

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

const PORT = process.env.PORT || 3000;
const SOCKET_PORT = process.env.SOCKET_PORT || 4000;

let redisClient;

(async () => {
  try {
    await app.prepare();
    console.log(`✅ Next.js prepared (${dev ? "development" : "production"} mode)`);

    // ✅ Redis connection
    try {
      redisClient = await getRedisClient();
      console.log("✅ Redis connected successfully");
    } catch (err) {
      console.error("❌ Redis connection failed:", err);
    }

    // ✅ Start Socket Server only once (prevents reload stops)
    if (!global.socketStarted) {
      await startSocketServer(SOCKET_PORT);
      global.socketStarted = true;
      console.log(`🚀 Socket.IO server running at http://localhost:${SOCKET_PORT}`);
    }

    // ✅ Start Next.js HTTP server
    const httpServer = createServer(async (req, res) => {
      try {
        await handle(req, res);
      } catch (err) {
        console.error("Error handling request:", err);
        res.statusCode = 500;
        res.end("Internal Server Error");
      }
    });

    httpServer.listen(PORT, () => {
      console.log(`🌐 Next.js server running at http://localhost:${PORT}`);
    });

    // ✅ Graceful shutdown (only in production)
    if (!dev) {
      const shutdown = async (signal) => {
        console.log(`\n🛑 Received ${signal}, shutting down...`);
        await stopSocketServer();

        httpServer.close(() => console.log("🧩 HTTP server closed."));

        if (redisClient) {
          try {
            await redisClient.quit();
            console.log("🧩 Redis disconnected.");
          } catch (err) {
            console.error("Redis shutdown error:", err);
          }
        }

        process.exit(0);
      };

      process.on("SIGINT", () => shutdown("SIGINT"));
      process.on("SIGTERM", () => shutdown("SIGTERM"));
    }
  } catch (err) {
    console.error("🔥 Fatal server initialization error:", err);
    process.exit(1);
  }
})();
