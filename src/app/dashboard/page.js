"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { io } from "socket.io-client";
import toast from "react-hot-toast";
import {
  PlusIcon,
  UsersIcon,
  ClockIcon,
  PlayIcon,
  EyeIcon,
  TrashIcon,
  RefreshCwIcon,
  RocketIcon,
  SparklesIcon,
} from "lucide-react";

export default function DashboardPage() {
  const [showModal, setShowModal] = useState(false);
  const [mode, setMode] = useState("create");
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    roomId: "",
    name: "",
    email: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const [recentRooms, setRecentRooms] = useState([]);
  const [socket, setSocket] = useState(null);
  const [roomStatuses, setRoomStatuses] = useState({});
  const [refreshing, setRefreshing] = useState(false);

  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
  const startSocket = async () => {
    try {
      await fetch("/api/start-editor");
      console.log("Requested socket server startup ✅");

      const socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_URL, {
        path: "/socket.io",
        transports: ["websocket"],
        reconnectionAttempts: 3,
        withCredentials: true,
      });

      socketInstance.on("connect", () => {
        console.log("Socket connected 🎉");
      });

      setSocket(socketInstance);

      return () => {
        socketInstance.disconnect();
      };
    } catch (err) {
      console.error("Failed to start socket server:", err);
    }
  };

  startSocket();

  return () => {
    fetch("/api/stop-editor").catch(() => {});
  };
}, []);


  // ✅ Handle redirect messages from EditorPage
  useEffect(() => {
    const status = params.get("status");
    const roomId = params.get("roomId");

    if (status === "paused") {
      toast(
        `⏸️ Room ${
          roomId ? `${roomId.slice(0, 8)}... ` : ""
        }was paused by the host.`,
        {
          icon: "⚠️",
          style: {
            background: "#FFFBEB",
            color: "#B45309",
            border: "1px solid #FCD34D",
          },
        }
      );
    } else if (status === "disabled") {
      toast.error(
        `🔴 Room ${
          roomId ? `${roomId.slice(0, 8)}... ` : ""
        }was closed by the host.`
      );
    } else if (status === "error") {
      toast.error("⚠️ Room unavailable or error occurred.");
    }
  }, [params]);

  // ✅ Load recent rooms from localStorage and check their status
  useEffect(() => {
    const storedRooms = localStorage.getItem("recentRooms");
    if (storedRooms) {
      const rooms = JSON.parse(storedRooms);
      setRecentRooms(rooms);
      checkRecentRoomsStatus(rooms);
    }

    const savedUser = localStorage.getItem("collabUser");
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      setFormData((prev) => ({
        ...prev,
        name: userData.name || "",
        email: userData.email || "",
      }));
    }
  }, [socket]);

  // ✅ Check status of all recent rooms
  const checkRecentRoomsStatus = async (rooms) => {
    if (!socket || rooms.length === 0) return;

    setRefreshing(true);
    const statusPromises = rooms.map(async (room) => {
      try {
        const statusResponse = await new Promise((resolve) => {
          socket.emit("check-room-status", { roomId: room.id }, (response) => {
            resolve(response);
          });
        });

        return {
          roomId: room.id,
          status: statusResponse.ok ? statusResponse.state : "unknown",
        };
      } catch (error) {
        return {
          roomId: room.id,
          status: "unknown",
        };
      }
    });

    const statusResults = await Promise.all(statusPromises);
    const statusMap = {};
    statusResults.forEach((result) => {
      statusMap[result.roomId] = result.status;
    });

    setRoomStatuses(statusMap);
    setRefreshing(false);
  };

  // ✅ Form validation
  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = "Name is required";
    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Please enter a valid email address";
    }
    if (mode === "join" && !formData.roomId.trim()) {
      errors.roomId = "Room ID is required";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ✅ Store recent rooms with enhanced data
  const addToRecentRooms = (roomId, roomName, type = "joined") => {
    const newRoom = {
      id: roomId,
      name: roomName || `Room ${roomId.slice(0, 8)}...`,
      type: type,
      lastAccessed: new Date().toISOString(),
      host: type === "created" ? formData.name : undefined,
    };

    const updatedRooms = [
      newRoom,
      ...recentRooms.filter((room) => room.id !== roomId),
    ].slice(0, 8);
    setRecentRooms(updatedRooms);
    localStorage.setItem("recentRooms", JSON.stringify(updatedRooms));
  };

  // ✅ Create Room
  const handleCreateRoom = async () => {
    const newRoomId = uuidv4();
    const userId = uuidv4();

    const collabUser = {
      id: userId,
      name: formData.name,
      email: formData.email,
      roomId: newRoomId,
      isHost: true,
    };

    localStorage.setItem("collabUser", JSON.stringify(collabUser));
    addToRecentRooms(newRoomId, `My Room - ${formData.name}`, "created");

    return newRoomId;
  };

  // ✅ Join Room
  const handleJoinRoom = async (roomId) => {
    if (!socket) {
      toast.error("Socket not connected.");
      return null;
    }

    const userId = uuidv4();

    try {
      const statusResponse = await new Promise((resolve) => {
        socket.emit("check-room-status", { roomId }, (response) => {
          resolve(response);
        });
      });

      if (!statusResponse.ok) {
        toast.error(statusResponse.message || "Cannot join this room.");
        setRoomStatuses((prev) => ({
          ...prev,
          [roomId]: "disabled",
        }));
        return null;
      }

      const collabUser = {
        id: userId,
        name: formData.name,
        email: formData.email,
        roomId: roomId.trim(),
        isHost: false,
      };

      localStorage.setItem("collabUser", JSON.stringify(collabUser));
      addToRecentRooms(
        roomId.trim(),
        `Joined Room - ${formData.name}`,
        "joined"
      );

      setRoomStatuses((prev) => ({
        ...prev,
        [roomId]: statusResponse.state,
      }));

      if (statusResponse.state === "paused") {
        toast("⏸️ Room is paused. You can view but not edit.", {
          icon: "⚠️",
          style: {
            background: "#FFFBEB",
            color: "#B45309",
            border: "1px solid #FCD34D",
          },
        });
      } else if (statusResponse.state === "active") {
        toast.success("✅ Joined active room!");
      }

      return roomId.trim();
    } catch (err) {
      toast.error("Server error checking room status.");
      return null;
    }
  };

  // ✅ Quick Join Recent Room
  const handleQuickJoinRecent = async (roomId) => {
    if (!socket) {
      toast.error("Socket not connected.");
      return;
    }

    setIsLoading(true);

    try {
      const statusResponse = await new Promise((resolve) => {
        socket.emit("check-room-status", { roomId }, (response) => {
          resolve(response);
        });
      });

      if (!statusResponse.ok) {
        toast.error(
          statusResponse.message || "This room is no longer available."
        );
        if (
          statusResponse.message?.includes("disabled") ||
          statusResponse.message?.includes("not exist")
        ) {
          removeRecentRoom(roomId);
        }
        setIsLoading(false);
        return;
      }

      setRoomStatuses((prev) => ({
        ...prev,
        [roomId]: statusResponse.state,
      }));

      if (statusResponse.state === "disabled") {
        toast.error("🔴 This room has been disabled by the host.");
        removeRecentRoom(roomId);
        setIsLoading(false);
        return;
      }

      const savedUser = localStorage.getItem("collabUser");
      let userData;

      if (savedUser) {
        userData = JSON.parse(savedUser);
        userData.roomId = roomId;
      } else {
        userData = {
          id: uuidv4(),
          name: formData.name,
          email: formData.email,
          roomId: roomId,
          isHost: false,
        };
      }

      localStorage.setItem("collabUser", JSON.stringify(userData));

      if (statusResponse.state === "paused") {
        toast("⏸️ Room is paused. You can view but not edit.", {
          icon: "⚠️",
          style: {
            background: "#FFFBEB",
            color: "#B45309",
            border: "1px solid #FCD34D",
          },
        });
      } else {
        toast.success("✅ Joined room!");
      }

      await new Promise((r) => setTimeout(r, 400));
      router.push(`/editor/${roomId}`);
    } catch (error) {
      toast.error("Failed to join room.");
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Resume Room
  const handleResumeRoom = async (roomId = null) => {
    if (!socket) {
      toast.error("Socket not connected.");
      return;
    }

    setIsLoading(true);

    const targetRoomId =
      roomId || JSON.parse(localStorage.getItem("collabUser"))?.roomId;

    if (!targetRoomId) {
      toast.error("No room ID found.");
      setIsLoading(false);
      return;
    }

    try {
      socket.emit("resume-room", { roomId: targetRoomId });

      setRoomStatuses((prev) => ({
        ...prev,
        [targetRoomId]: "active",
      }));

      toast.success("Room resumed!");
      await new Promise((r) => setTimeout(r, 400));
      router.push(`/editor/${targetRoomId}`);
    } catch (error) {
      toast.error("Failed to resume room.");
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Remove recent room
  const removeRecentRoom = (roomId) => {
    const updatedRooms = recentRooms.filter((room) => room.id !== roomId);
    setRecentRooms(updatedRooms);
    localStorage.setItem("recentRooms", JSON.stringify(updatedRooms));

    setRoomStatuses((prev) => {
      const newStatuses = { ...prev };
      delete newStatuses[roomId];
      return newStatuses;
    });

    toast.success("Room removed from recent list");
  };

  // ✅ Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);

    try {
      let roomId;

      if (mode === "create") {
        roomId = await handleCreateRoom();
      } else {
        roomId = await handleJoinRoom(formData.roomId);
      }

      if (!roomId) {
        setIsLoading(false);
        return;
      }

      await new Promise((r) => setTimeout(r, 400));
      router.push(`/editor/${roomId}`);
    } catch (error) {
      toast.error("Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ UI helpers
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const resetForm = () => {
    setFormData({
      roomId: "",
      name: formData.name,
      email: formData.email,
    });
    setFormErrors({});
  };

  // ✅ Get room status badge
  const getStatusBadge = (roomId) => {
    const status = roomStatuses[roomId];
    switch (status) {
      case "active":
        return (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full">
            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
            <span className="text-xs font-semibold text-emerald-700">
              Active
            </span>
          </div>
        );
      case "paused":
        return (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-full">
            <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
            <span className="text-xs font-semibold text-amber-700">Paused</span>
          </div>
        );
      case "disabled":
        return (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 border border-rose-200 rounded-full">
            <div className="w-2 h-2 bg-rose-500 rounded-full"></div>
            <span className="text-xs font-semibold text-rose-700">Closed</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-full">
            <div className="w-2 h-2 bg-slate-500 rounded-full"></div>
            <span className="text-xs font-semibold text-slate-700">
              Unknown
            </span>
          </div>
        );
    }
  };

  // ✅ Get room action button
  const getRoomAction = (room) => {
    const status = roomStatuses[room.id];

    if (status === "disabled") {
      return (
        <button
          onClick={() => removeRecentRoom(room.id)}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-slate-100 text-slate-600 rounded-xl cursor-not-allowed font-medium"
          disabled
        >
          <TrashIcon size={16} />
          Remove
        </button>
      );
    }

    if (status === "paused") {
      return (
        <div className="flex gap-2">
          <button
            onClick={() => handleResumeRoom(room.id)}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl font-medium shadow-sm transition-all duration-200 disabled:opacity-50"
          >
            <PlayIcon size={16} />
            {isLoading ? "..." : "Resume"}
          </button>
          <button
            onClick={() => handleQuickJoinRecent(room.id)}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-medium shadow-sm transition-all duration-200 disabled:opacity-50"
          >
            <EyeIcon size={16} />
            {isLoading ? "..." : "View"}
          </button>
        </div>
      );
    }

    return (
      <button
        onClick={() => handleQuickJoinRecent(room.id)}
        disabled={isLoading}
        className="flex items-center gap-2 px-4 py-2 text-sm bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-medium shadow-sm transition-all duration-200 disabled:opacity-50"
      >
        <RocketIcon size={16} />
        {isLoading ? "..." : "Join"}
      </button>
    );
  };

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-3 mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
            <SparklesIcon className="w-8 h-8 text-white" />
          </div>
          <div className="text-left">
            <h1 className="text-4xl font-bold bg-gradient-to-br from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Welcome Back!
            </h1>
            <p className="text-lg text-slate-600">
              Ready to start coding collaboratively?
            </p>
          </div>
        </div>
      </div>

      {/* Status Alerts */}
      {params.get("status") && (
        <div
          className={`max-w-4xl mx-auto rounded-2xl p-6 text-center backdrop-blur-sm border ${
            params.get("status") === "paused"
              ? "bg-amber-50/80 border-amber-200 text-amber-800"
              : params.get("status") === "disabled"
              ? "bg-rose-50/80 border-rose-200 text-rose-800"
              : "bg-slate-50/80 border-slate-200 text-slate-800"
          }`}
        >
          <div className="flex items-center justify-center gap-3 mb-2">
            {params.get("status") === "paused" ? (
              <>
                <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">⏸️</span>
                </div>
                <h3 className="font-semibold text-lg">Room Paused</h3>
              </>
            ) : params.get("status") === "disabled" ? (
              <>
                <div className="w-8 h-8 bg-rose-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">🔴</span>
                </div>
                <h3 className="font-semibold text-lg">Room Closed</h3>
              </>
            ) : (
              <>
                <div className="w-8 h-8 bg-slate-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">⚠️</span>
                </div>
                <h3 className="font-semibold text-lg">Room Unavailable</h3>
              </>
            )}
          </div>
          <p className="text-sm opacity-90">
            {params.get("status") === "paused"
              ? "The room was paused by the host. You can resume it below."
              : params.get("status") === "disabled"
              ? "The room was closed by the host. Please create a new one."
              : "The room is unavailable or an error occurred."}
          </p>

          {/* Action Buttons */}
          {params.get("status") === "paused" && (
            <div className="mt-4">
              <button
                onClick={() => handleResumeRoom()}
                disabled={isLoading}
                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg transition-all duration-200 disabled:opacity-50"
              >
                {isLoading ? "Resuming..." : "Resume Room"}
              </button>
            </div>
          )}

          {params.get("status") === "disabled" && (
            <div className="mt-4">
              <button
                onClick={() => {
                  setMode("create");
                  setShowModal(true);
                }}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg transition-all duration-200"
              >
                Create New Room
              </button>
            </div>
          )}
        </div>
      )}

      {/* Quick Actions Grid */}
      <div className="grid lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {/* Create Room Card */}
        <div className="group relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl blur opacity-10 group-hover:opacity-20 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative bg-white rounded-2xl shadow-xl border border-slate-200 p-8 hover:shadow-2xl transition-all duration-300">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <PlusIcon className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-3">
                Create New Room
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Start a fresh collaborative coding session. Invite team members
                and code together in real-time.
              </p>
            </div>
            <button
              onClick={() => {
                setMode("create");
                setShowModal(true);
              }}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Create Room
            </button>
          </div>
        </div>

        {/* Join Room Card */}
        <div className="group relative">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-green-600 rounded-3xl blur opacity-10 group-hover:opacity-20 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative bg-white rounded-2xl shadow-xl border border-slate-200 p-8 hover:shadow-2xl transition-all duration-300">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <UsersIcon className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-3">
                Join Room
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Enter a room ID to join an existing collaborative session. Code
                together with your team in real-time.
              </p>
            </div>
            <button
              onClick={() => {
                setMode("join");
                setShowModal(true);
              }}
              className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Join Room
            </button>
          </div>
        </div>
      </div>

      {/* Recent Rooms Section */}
      {recentRooms.length > 0 && (
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200 p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <ClockIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-800 mb-1">
                    Recent Rooms
                  </h3>
                  <p className="text-slate-600">
                    Quick access to your recently visited rooms
                  </p>
                </div>
              </div>
              <button
                onClick={() => checkRecentRoomsStatus(recentRooms)}
                disabled={refreshing}
                className="mt-4 sm:mt-0 px-4 py-2 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-colors duration-200 flex items-center gap-2 disabled:opacity-50"
              >
                <RefreshCwIcon
                  className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
                />
                {refreshing ? "Refreshing..." : "Refresh Status"}
              </button>
            </div>

            <div className="grid gap-4">
              {recentRooms.map((room) => (
                <div
                  key={room.id}
                  className="group bg-white border border-slate-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:border-slate-300"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h4 className="font-semibold text-slate-800 text-lg">
                          {room.name}
                        </h4>
                        {getStatusBadge(room.id)}
                        {room.type === "created" && (
                          <span className="px-3 py-1 text-xs bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-full font-medium shadow-sm">
                            Host
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                        <span className="flex items-center gap-1">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                            />
                          </svg>
                          ID: {room.id.slice(0, 10)}...
                        </span>
                        <span className="flex items-center gap-1">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          {new Date(room.lastAccessed).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </span>
                        {room.host && (
                          <span className="flex items-center gap-1">
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                              />
                            </svg>
                            Host: {room.host}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {getRoomAction(room)}
                      <button
                        onClick={() => removeRecentRoom(room.id)}
                        className="p-2 text-slate-400 hover:text-rose-500 transition-all duration-200 rounded-xl hover:bg-rose-50 group/remove"
                        title="Remove from recent"
                      >
                        <TrashIcon className="w-5 h-5 group-hover/remove:scale-110 transition-transform" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md relative animate-in zoom-in duration-300">
            {/* Header */}
            <div className="relative p-8 pb-6">
              <div className="text-center">
                <div
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
                    mode === "create"
                      ? "bg-gradient-to-br from-blue-500 to-blue-600"
                      : "bg-gradient-to-br from-emerald-500 to-emerald-600"
                  }`}
                >
                  {mode === "create" ? (
                    <PlusIcon className="w-8 h-8 text-white" />
                  ) : (
                    <UsersIcon className="w-8 h-8 text-white" />
                  )}
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">
                  {mode === "create" ? "Create New Room" : "Join Room"}
                </h2>
                <p className="text-slate-600">
                  {mode === "create"
                    ? "Start a new collaborative coding session"
                    : "Enter room details to join an existing session"}
                </p>
              </div>

              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors p-2 rounded-xl hover:bg-slate-100"
                disabled={isLoading}
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-8 pt-0 space-y-6">
              {mode === "join" && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">
                    Room ID *
                  </label>
                  <input
                    type="text"
                    name="roomId"
                    value={formData.roomId}
                    onChange={handleChange}
                    placeholder="Enter the room ID"
                    className={`w-full border-2 rounded-xl px-4 py-4 focus:ring-2 focus:ring-offset-2 focus:border-transparent transition-all duration-200 ${
                      formErrors.roomId
                        ? "border-rose-500 focus:ring-rose-200 bg-rose-50"
                        : "border-slate-200 focus:ring-blue-200 focus:border-blue-500 hover:border-slate-300"
                    }`}
                    disabled={isLoading}
                  />
                  {formErrors.roomId && (
                    <p className="text-rose-500 text-sm mt-2 flex items-center gap-1">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      {formErrors.roomId}
                    </p>
                  )}
                </div>
              )}

              {/* Common Fields */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Your Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your name"
                  className={`w-full border-2 rounded-xl px-4 py-4 focus:ring-2 focus:ring-offset-2 focus:border-transparent transition-all duration-200 ${
                    formErrors.name
                      ? "border-rose-500 focus:ring-rose-200 bg-rose-50"
                      : "border-slate-200 focus:ring-blue-200 focus:border-blue-500 hover:border-slate-300"
                  }`}
                  disabled={isLoading}
                />
                {formErrors.name && (
                  <p className="text-rose-500 text-sm mt-2 flex items-center gap-1">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    {formErrors.name}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your.email@example.com"
                  className={`w-full border-2 rounded-xl px-4 py-4 focus:ring-2 focus:ring-offset-2 focus:border-transparent transition-all duration-200 ${
                    formErrors.email
                      ? "border-rose-500 focus:ring-rose-200 bg-rose-50"
                      : "border-slate-200 focus:ring-blue-200 focus:border-blue-500 hover:border-slate-300"
                  }`}
                  disabled={isLoading}
                />
                {formErrors.email && (
                  <p className="text-rose-500 text-sm mt-2 flex items-center gap-1">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    {formErrors.email}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none disabled:hover:shadow-lg ${
                  mode === "create"
                    ? "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:bg-blue-400"
                    : "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 disabled:bg-emerald-400"
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-6 h-6 border-t-2 border-white rounded-full animate-spin mr-3"></div>
                    {mode === "create" ? "Creating Room..." : "Joining Room..."}
                  </div>
                ) : mode === "create" ? (
                  "Create Room"
                ) : (
                  "Join Room"
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
