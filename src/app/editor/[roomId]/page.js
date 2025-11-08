"use client";

import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import { useParams, useRouter } from "next/navigation";
import Editor from "@monaco-editor/react";
import {
  Users,
  Bell,
  Copy,
  Share2,
  CheckCircle2,
  Globe,
  Code,
} from "lucide-react";
import toast from "react-hot-toast";

export default function EditorPage() {
  const { roomId } = useParams();
  const router = useRouter();
  const [code, setCode] = useState(
    "// Start coding collaboratively...\n\nfunction welcome() {\n  console.log('Hello from Room: ' + roomId);\n}"
  );
  const [socket, setSocket] = useState(null);
  const [users, setUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [copied, setCopied] = useState(false);
  const notificationsRef = useRef(null);
  const [roomStatus, setRoomStatus] = useState("active"); // active | paused | disabled

  const NEXT_PUBLIC_SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL|| 'http://localhost:4000';
  console.log("Socket Server URL:",NEXT_PUBLIC_SOCKET_URL);

  // ✅ Initialize socket
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("collabUser"));
    if (!storedUser || storedUser.roomId !== roomId) {
      toast.error("Missing user info! Please log in again.");
      router.replace("/dashboard");
      return;
    }
    setUsers([storedUser]);

    const socketInstance = io(NEXT_PUBLIC_SOCKET_URL, {
      path: "/socket.io",
      transports: ["websocket"],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    setSocket(socketInstance);

    socketInstance.on("connect", () => {
      console.log("Connected:", socketInstance.id);
      socketInstance.emit("join-room", { roomId, user: storedUser });
    });

    socketInstance.on("connect_error", (err) => {
      console.error("Connection error:", err.message);
      toast.error("Connection error. Retrying...");
    });

    socketInstance.on("disconnect", (reason) => {
      console.warn(" Disconnected:", reason);
      toast.error("Disconnected from server. Reconnecting...");
    });

    // --- Sync Code ---
    socketInstance.on("load-code", (savedCode) =>
      setCode(
        savedCode ||
          "// Start coding collaboratively...\n\nfunction welcome() {\n  console.log('Hello from Room: ' + roomId);\n}"
      )
    );
    socketInstance.on("code-update", (newCode) => setCode(newCode));

    // --- Notifications ---
    socketInstance.on("user-joined", (userData) => {
      setNotifications((prev) => [
        {
          id: Date.now(),
          message: `${userData.name || "A user"} joined`,
          type: "join",
          timestamp: new Date(),
        },
        ...prev.slice(0, 9),
      ]);
    });

    socketInstance.on("user-left", (userData) => {
      setNotifications((prev) => [
        {
          id: Date.now(),
          message: `${userData.name || "A user"} left`,
          type: "leave",
          timestamp: new Date(),
        },
        ...prev.slice(0, 9),
      ]);
    });

    socketInstance.on("room-members", (memberList) => setUsers(memberList));

    // --- Room Status Events (uniform handler)
    const handleRoomEvent = (
      eventName,
      response,
      successMsg,
      redirect = true
    ) => {
      console.log(`[${eventName}]`, response);

      //  1. Validate payload structure
      if (!response || typeof response !== "object") {
        console.warn(`[${eventName}] Invalid payload:`, response);
        return;
      }

      if (typeof response.ok !== "boolean") {
        console.warn(`[${eventName}] Missing 'ok' field:`, response);
        return;
      }

      const state = response.state || eventName.replace("room-", ""); // derive 'paused' / 'disabled' / 'resumed'

      //  2. Handle success responses
      if (response.ok) {
        // Update room UI state immediately
        switch (state) {
          case "paused":
            setRoomStatus("paused");
            toast.success(response.message || "⏸️ Room paused by host.");
            break;
          case "active":
          case "resumed":
            setRoomStatus("active");
            toast.success(response.message || "🟢 Room resumed.");
            break;
          case "disabled":
            setRoomStatus("disabled");
            toast.error(response.message || "🔴 Room closed by host.");
            break;
          default:
            break;
        }

        //  3. Redirect logic (only for paused/disabled)
        if (redirect && ["paused", "disabled"].includes(state)) {
          toast.loading("Redirecting to dashboard...");
          setTimeout(() => {
            try {
              if (socket?.connected) socket.disconnect();
            } catch (e) {
              console.warn("Error disconnecting socket:", e);
            }

            // Pass query parameter for dashboard message
            const query =
              state === "paused" ? "?status=paused" : "?status=disabled";
            router.push(`/dashboard${query}`);
          }, 1000);
        }
      }
      //  4. Handle server errors or failed cases
      else {
        const msg = response.message || "Unknown error";
        const code = response.status || 400;

        if (code >= 500) toast.error(`Server Error: ${msg}`);
        else toast.error(msg);

        console.warn(`[${eventName}] failed (${code}):`, msg);

        // Redirect only if room became invalid
        if (["room-paused", "room-disabled"].includes(eventName)) {
          router.push("/dashboard?status=error");
        }
      }
    };

    // Bind event handlers
    socketInstance.on("room-paused", (res) =>
      handleRoomEvent("room-paused", res, "Room paused by host.")
    );
    socketInstance.on("room-resumed", (res) =>
      handleRoomEvent("room-resumed", res, "Room resumed successfully.", false)
    );
    socketInstance.on("room-disabled", (res) =>
      handleRoomEvent("room-disabled", res, "Room closed by host.")
    );

    socketInstance.connect();
    return () => socketInstance.disconnect();
  }, [roomId, router]);

  // Close notifications when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle code changes
  const handleCodeChange = (value) => {
    setCode(value);
    if (roomStatus === "active") {
      socket?.emit("code-change", { roomId, code: value });
    }
  };

  //  Copy & share room
  const copyRoomId = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      setCopied(true);
      toast.success("Room ID copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy room ID");
    }
  };

  const shareRoom = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Collaborative Code Editor",
          text: "Join me in this session!",
          url: window.location.href,
        });
      } catch {
        toast.error("Share cancelled.");
      }
    } else {
      copyRoomId();
    }
  };

  const formatTime = (date) =>
    new Date(date).toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    });

  const user = JSON.parse(localStorage.getItem("collabUser"));
  const isOwner = users[0]?.userId === user?.userId;

  // Render
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      {/* Header */}
      <header className="border-b border-gray-700 bg-gray-800/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Left */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Code className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-lg font-semibold">Collaborative Editor</h1>
                <div className="flex items-center space-x-2 text-sm text-gray-300">
                  <Globe className="h-3 w-3" />
                  <span>Room: {roomId}</span>
                </div>
              </div>
            </div>

            {/* Copy + Share */}
            <div className="flex items-center space-x-2">
              <button
                onClick={copyRoomId}
                className="flex items-center space-x-1 px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 rounded-md"
              >
                {copied ? (
                  <CheckCircle2 className="h-4 w-4 text-green-400" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                <span>{copied ? "Copied!" : "Copy ID"}</span>
              </button>

              <button
                onClick={shareRoom}
                className="flex items-center space-x-1 px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-500 rounded-md"
              >
                <Share2 className="h-4 w-4" />
                <span>Share</span>
              </button>

              {isOwner && (
                <div className="flex items-center space-x-2 ml-2">
                  {roomStatus === "active" && (
                    <button
                      onClick={() => socket.emit("pause-room", { roomId })}
                      className="bg-yellow-600 hover:bg-yellow-500 px-3 py-1.5 rounded-md text-sm"
                    >
                      Pause Room
                    </button>
                  )}
                  {roomStatus === "paused" && (
                    <button
                      onClick={() => socket.emit("resume-room", { roomId })}
                      className="bg-green-600 hover:bg-green-500 px-3 py-1.5 rounded-md text-sm"
                    >
                      Resume
                    </button>
                  )}
                  <button
                    onClick={() => socket.emit("disable-room", { roomId })}
                    className="bg-red-600 hover:bg-red-500 px-3 py-1.5 rounded-md text-sm"
                  >
                    Stop Room
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Notifications */}
          <div className="flex items-center space-x-4">
            <div className="relative" ref={notificationsRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg"
              >
                <Bell className="h-5 w-5" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-xs rounded-full flex items-center justify-center">
                    {notifications.length}
                  </span>
                )}
              </button>
              {showNotifications && (
                <div className="absolute right-0 top-12 w-80 bg-gray-800 border border-gray-700 rounded-lg shadow-xl">
                  <div className="p-3 border-b border-gray-700">
                    <h3 className="font-semibold flex items-center space-x-2">
                      <Bell className="h-4 w-4" />
                      <span>Recent Activity</span>
                    </h3>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        className="p-3 border-b border-gray-700 last:border-b-0 hover:bg-gray-750"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex items-center space-x-2">
                            <div
                              className={`w-2 h-2 rounded-full ${
                                n.type === "join"
                                  ? "bg-green-400"
                                  : "bg-red-400"
                              }`}
                            />
                            <span className="text-sm">{n.message}</span>
                          </div>
                          <span className="text-xs text-gray-400">
                            {formatTime(n.timestamp)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-3 bg-gray-700/50 px-3 py-2 rounded-lg">
              <Users className="h-4 w-4 text-gray-300" />
              <span className="text-sm font-medium">{users.length}</span>
              <span className="text-sm text-gray-300">online</span>
            </div>
          </div>
        </div>
      </header>

      {/* Editor */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 relative z-10">
        {/* === Editor Container === */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-2xl">
          {/* Header Bar */}
          <div className="px-4 py-2 bg-gray-900 border-b border-gray-700 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {/* Traffic lights like macOS code editor */}
              <div className="flex space-x-1">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
              <span className="text-sm text-gray-300 font-mono">editor.js</span>
            </div>

            <div className="text-xs text-gray-400">
              {users.length} user{users.length !== 1 ? "s" : ""} editing
            </div>
          </div>

          {/* === Monaco Editor === */}
          <div className="relative z-0">
            <Editor
              height="75vh"
              language="javascript"
              theme="vs-dark"
              value={code}
              onChange={handleCodeChange}
              options={{
                readOnly: roomStatus !== "active", // lock editor if paused/disabled
                fontSize: 14,
                lineHeight: 1.5,
                fontFamily: "'Fira Code', 'Courier New', monospace",
                minimap: { enabled: true },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
                wordWrap: "on",
                smoothScrolling: true,
                cursorBlinking: "smooth",
                fixedOverflowWidgets: true,
              }}
            />
          </div>
        </div>

        {/* === Footer Info Bar === */}
        <div className="mt-4 flex items-center justify-between text-sm text-gray-400">
          <div className="flex items-center space-x-4">
            <span>
              Connected to room:{" "}
              <strong className="text-gray-300 font-mono">{roomId}</strong>
            </span>
            <span>•</span>
            <span>
              Language: <strong className="text-gray-300">JavaScript</strong>
            </span>
            <span>•</span>
            <span>
              Status:{" "}
              <strong
                className={`${
                  roomStatus === "active"
                    ? "text-green-400"
                    : roomStatus === "paused"
                    ? "text-yellow-400"
                    : "text-red-400"
                }`}
              >
                {roomStatus.toUpperCase()}
              </strong>
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <div
              className={`w-2 h-2 rounded-full ${
                socket?.connected ? "bg-green-400" : "bg-red-400"
              }`}
            ></div>
            <span>{socket?.connected ? "Connected" : "Disconnected"}</span>
          </div>
        </div>
      </main>
    </div>
  );
}
