import http from "http";
import { Server } from "socket.io";
import { v4 as uuidv4 } from "uuid";
import zlib from "zlib";
import Room from "../app/api/model/room.model.js";
import { getRedisClient } from "./redisClient.js";

let io = null;
let httpServer = null;
let autoSaveTimer = null;
const members = {};
const roomState = {};

const AUTO_SAVE_MS = 5000;
const ROOM_TTL_SEC = 300;
const ENABLE_COMPRESSION = true;
const MAX_HISTORY = 50;

// ✅ Helpers
const safeEmit = (target, event, payload = {}) =>
  target.emit(event, {
    ok: typeof payload.ok === "boolean" ? payload.ok : false,
    status: payload.status || 500,
    message: payload.message || "Unknown error",
    ...payload,
  });

const compress = (text) =>
  ENABLE_COMPRESSION ? zlib.gzipSync(text).toString("base64") : text;

const decompress = (base64) => {
  try {
    return ENABLE_COMPRESSION
      ? zlib.gunzipSync(Buffer.from(base64, "base64")).toString()
      : base64;
  } catch {
    return base64 || "";
  }
};

async function persistRoom(roomId, code) {
  try {
    await Room.findOneAndUpdate(
      { roomId },
      {
        $set: {
          code,
          status:
            roomState[roomId]?.disabled
              ? "disabled"
              : roomState[roomId]?.paused
              ? "paused"
              : "active",
          updatedAt: new Date(),
        },
        $push: {
          roomHistory: {
            $each: [{ code, savedAt: new Date() }],
            $slice: -MAX_HISTORY,
          },
        },
      },
      { upsert: true }
    );
  } catch (err) {
    console.error("[Mongo Persist Error]", err);
  }
}

// ✅ Start socket server
export async function startSocketServer(port = 4000) {
  if (io) {
    console.log("[Socket] Already running");
    return io;
  }

  const redis = await getRedisClient();

  httpServer = http.createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Socket.IO Server is live 🚀");
  });

  io = new Server(httpServer, {
    path: "/socket.io",
    cors: {
      origin: ["http://localhost:3000"],
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });

  httpServer.listen(port, () =>
    console.log(`⚡ Socket.IO running on http://localhost:${port}`)
  );

  // ✅ Auto-save loop
  autoSaveTimer = setInterval(async () => {
    try {
      const keys = await redis.keys("room:*:code");
      for (const key of keys) {
        const roomId = key.split(":")[1];
        const data = await redis.get(key);
        if (data) await persistRoom(roomId, decompress(data));
      }
    } catch (err) {
      console.error("[AutoSave Error]", err);
    }
  }, AUTO_SAVE_MS);

  // ✅ Event handling
  io.on("connection", (socket) => {
    console.log(`[Socket] Connected: ${socket.id}`);

    // === JOIN ROOM ===
    socket.on("join-room", async ({ roomId, user }) => {
      try {
        if (!roomId || !user)
          return safeEmit(socket, "room-disabled", {
            ok: false,
            message: "Missing roomId or user.",
          });

        socket.join(roomId);
        socket.data.roomId = roomId;
        socket.data.user = user;

        const cacheKey = `room:${roomId}:code`;
        let code = await redis.get(cacheKey);

        if (!code) {
          const dbRoom = await Room.findOne({ roomId }).lean();
          code = dbRoom?.code || "";
          await redis.set(cacheKey, compress(code), { EX: ROOM_TTL_SEC });
        }

        socket.emit("load-code", decompress(code));
        io.to(roomId).emit("user-joined", user);

        if (!members[roomId]) members[roomId] = [];
        members[roomId] = members[roomId].filter(
          (m) => m.userId !== user.userId
        );
        members[roomId].push({ ...user, socketId: socket.id });

        io.to(roomId).emit("room-members", members[roomId]);
      } catch (err) {
        console.error("[JOIN ERROR]", err);
      }
    });

    // === CODE CHANGE ===
    socket.on("code-change", async ({ roomId, code }) => {
      try {
        if (!roomId) return;
        await redis.set(`room:${roomId}:code`, compress(code), {
          EX: ROOM_TTL_SEC,
        });
        socket.to(roomId).emit("code-update", code);
      } catch (err) {
        console.error("[CODE ERROR]", err);
      }
    });

    // === PAUSE ROOM ===
    socket.on("pause-room", async ({ roomId }) => {
      try {
        const data = await redis.get(`room:${roomId}:code`);
        const code = decompress(data || "");
        await persistRoom(roomId, code);
        roomState[roomId] = { paused: true };
        io.to(roomId).emit("room-paused", { ok: true, state: "paused" });
        console.log(`[Room] ${roomId} paused`);
      } catch (err) {
        console.error("[PAUSE ERROR]", err);
      }
    });

    // === RESUME ROOM ===
    socket.on("resume-room", async ({ roomId }) => {
      try {
        const oldRoom = await Room.findOne({ roomId }).lean();
        if (!oldRoom)
          return safeEmit(socket, "room-resumed", {
            ok: false,
            message: "Room not found.",
          });

        const newRoomId = uuidv4();
        await Room.create({
          roomId: newRoomId,
          code: oldRoom.code,
          status: "active",
          resumedFrom: roomId,
          roomHistory: oldRoom.roomHistory?.slice(-MAX_HISTORY) || [],
        });

        await Room.updateOne({ roomId }, { status: "archived" });
        await redis.set(
          `room:${newRoomId}:code`,
          compress(oldRoom.code || ""),
          { EX: ROOM_TTL_SEC }
        );

        io.to(roomId).emit("room-resumed", {
          ok: true,
          newRoomId,
          state: "active",
          message: "Room resumed with new ID.",
        });

        console.log(`[Room] ${roomId} → ${newRoomId} resumed`);
      } catch (err) {
        console.error("[RESUME ERROR]", err);
      }
    });

    // === DISABLE ROOM ===
    socket.on("disable-room", async ({ roomId }) => {
      try {
        await redis.del(`room:${roomId}:code`);
        await Room.findOneAndUpdate(
          { roomId },
          { status: "disabled", disabledAt: new Date() }
        );
        roomState[roomId] = { disabled: true };
        io.to(roomId).emit("room-disabled", { ok: true, state: "disabled" });
        console.log(`[Room] ${roomId} disabled`);
      } catch (err) {
        console.error("[DISABLE ERROR]", err);
      }
    });

    // === CHECK ROOM STATUS (Dashboard) ===
    socket.on("check-room-status", async ({ roomId }, callback) => {
      try {
        if (!roomId)
          return callback({
            ok: false,
            message: "Missing room ID.",
            state: "unknown",
          });

        const cacheKey = `room:${roomId}:code`;
        const cached = await redis.get(cacheKey);
        let state = "unknown";

        if (cached) {
          state = roomState[roomId]?.disabled
            ? "disabled"
            : roomState[roomId]?.paused
            ? "paused"
            : "active";
          return callback({
            ok: true,
            state,
            message: `Room ${roomId} is ${state}`,
          });
        }

        const dbRoom = await Room.findOne({ roomId }).lean();
        if (!dbRoom)
          return callback({
            ok: false,
            message: "Room does not exist.",
            state: "unknown",
          });

        state = dbRoom.status || "unknown";
        callback({
          ok: state !== "disabled",
          state,
          message: `Room ${roomId} is ${state}`,
        });
      } catch (err) {
        console.error("[CHECK STATUS ERROR]", err);
        callback({
          ok: false,
          message: "Server error checking room status.",
          state: "unknown",
        });
      }
    });

    // === DISCONNECT ===
    socket.on("disconnect", () => {
      const { roomId, user } = socket.data || {};
      if (!roomId || !user) return;
      members[roomId] = (members[roomId] || []).filter(
        (m) => m.userId !== user.userId
      );
      io.to(roomId).emit("user-left", user);
      io.to(roomId).emit("room-members", members[roomId]);
    });
  });

  return io;
}

// ✅ Stop server
export async function stopSocketServer() {
  if (!io) return;
  await io.close();
  if (httpServer) httpServer.close();
  clearInterval(autoSaveTimer);
  io = null;
  console.log("[Socket] Server stopped 🛑");
}
