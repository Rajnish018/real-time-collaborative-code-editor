      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 relative z-10">
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-2xl"
          <div className="px-4 py-2 bg-gray-900 border-b border-gray-700 flex items-center 
justify-between">
            <div className="flex items-center space-x-2">
              <div className="flex space-x-1">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
              <span className="text-sm text-gray-300">editor.js</span>
            </div>
            <div className="text-xs text-gray-400">
              {users.length} user{users.length !== 1 ? "s" : ""} editing
            </div>
          </div>
          {/* Monaco Editor - Force lower stacking context */}
          <div className="relative z-0">
            <Editor
              height="75vh"
              language="javascript"
              theme="vs-dark"
              value={code}
              onChange={handleCodeChange}
              options={{
                readOnly: roomStatus !== "active", // Read-only when paused/disabled
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
        {/* Quick Stats Footer */}
        <div className="mt-4 flex items-center justify-between text-sm text-gray-400">
          <div className="flex items-center space-x-4">
            <span>
              Connected to room:{" "}
              <strong className="text-gray-300">{roomId}</strong>
            </span>
            <span>•</span>
            <span>
              Language: <strong className="text-gray-300">JavaScript</strong>
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
      </main>"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

export default function DashboardPage() {
  const [showModal, setShowModal] = useState(false);
  const [mode, setMode] = useState("create");
  const [formData, setFormData] = useState({
    roomId: "",
    name: "",
    email: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();

  const handleJoin = (roomId) => {
    if (roomId.trim()) {
      router.push(`/editor/${roomId.trim()}`);
    } else {
      alert("Please enter a valid Room ID");
    }
  };

  const handleCreate = () => {
    const newRoomId = uuidv4();
    const userId = uuidv4();

    const collabUser = {
      id: userId,
      name: formData.name,
      email: formData.email,
      roomId: newRoomId,
    };
    
    localStorage.setItem("collabUser", JSON.stringify(collabUser));
    router.push(`/editor/${newRoomId}`);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (!formData.name || !formData.email) {
      alert("Please fill in all required fields.");
      setIsLoading(false);
      return;
    }

    try {
      if (mode === "create") {
        handleCreate();
      } else {
        handleJoin(formData.roomId);
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error("Error:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
      setShowModal(false);
      setFormData({ roomId: "", name: "", email: "" });
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 relative overflow-hidden">
      {/* Animated Coding Background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-gray-900"></div>
        
        {/* Floating Code Elements */}
        <div className="absolute top-10 left-10 text-green-400 font-mono text-sm animate-pulse">
          <div className="opacity-60">function createRoom() {"{"}</div>
          <div className="opacity-40 ml-4">return collaboration;</div>
          <div className="opacity-60">{"}"}</div>
        </div>
        
        <div className="absolute top-1/4 right-20 text-blue-400 font-mono text-sm animate-bounce">
          <div className="opacity-70">const team = {"{"}</div>
          <div className="opacity-50 ml-4">developers: [you, team];</div>
          <div className="opacity-70">{"}"}</div>
        </div>
        
        <div className="absolute bottom-1/3 left-20 text-yellow-400 font-mono text-sm animate-pulse delay-1000">
          <div className="opacity-60">{"<Editor>"}</div>
          <div className="opacity-40 ml-4">{"<Code />"}</div>
          <div className="opacity-60">{"</Editor>"}</div>
        </div>
        
        <div className="absolute bottom-20 right-10 text-purple-400 font-mono text-sm animate-bounce delay-500">
          <div className="opacity-70">export default function App() {"{"}</div>
          <div className="opacity-50 ml-4">return success;</div>
          <div className="opacity-70">{"}"}</div>
        </div>

        {/* Binary Rain Effect */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute text-green-400/20 font-mono text-xs animate-drop"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${15 + Math.random() * 10}s`
              }}
            >
              {Math.random() > 0.5 ? '1' : '0'}
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16 pt-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl mb-6 shadow-2xl">
            <span className="text-3xl">💻</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            CodeCollab
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Real-time collaborative code editing. Code together with your team, 
            no matter where you are. Instant setup, powerful collaboration.
          </p>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-6 border border-gray-700 hover:border-blue-500/50 transition-all duration-300 group">
            <div className="w-14 h-14 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <span className="text-2xl text-blue-400">👥</span>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Real-time Sync</h3>
            <p className="text-gray-400 text-sm">See changes instantly as your team codes</p>
          </div>
          
          <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-6 border border-gray-700 hover:border-green-500/50 transition-all duration-300 group">
            <div className="w-14 h-14 bg-green-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <span className="text-2xl text-green-400">⚡</span>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Lightning Fast</h3>
            <p className="text-gray-400 text-sm">Start coding together in seconds</p>
          </div>
          
          <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-6 border border-gray-700 hover:border-purple-500/50 transition-all duration-300 group">
            <div className="w-14 h-14 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <span className="text-2xl text-purple-400">🔒</span>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Secure & Private</h3>
            <p className="text-gray-400 text-sm">End-to-end encrypted collaboration</p>
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto mb-16">
          {/* Create Room Card */}
          <div className="bg-gradient-to-br from-blue-500/10 to-purple-600/10 backdrop-blur-lg rounded-3xl p-8 border border-blue-500/20 hover:border-blue-400/40 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/20 group">
            <div className="flex items-center justify-between mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <span className="text-2xl text-white">🚀</span>
              </div>
              <div className="text-blue-400 text-sm font-mono px-3 py-1 bg-blue-500/20 rounded-full">
                NEW ROOM
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Create New Session</h2>
            <p className="text-blue-100/80 mb-6 leading-relaxed">
              Launch a fresh coding environment and invite your team to collaborate in real-time. Perfect for new projects and brainstorming sessions.
            </p>
            <ul className="text-blue-100/60 text-sm mb-8 space-y-2">
              <li className="flex items-center">
                <span className="text-green-400 mr-2">✓</span>
                Generate unique room ID automatically
              </li>
              <li className="flex items-center">
                <span className="text-green-400 mr-2">✓</span>
                Invite unlimited team members
              </li>
              <li className="flex items-center">
                <span className="text-green-400 mr-2">✓</span>
                Full admin controls
              </li>
            </ul>
            <button
              onClick={() => {
                setMode("create");
                setShowModal(true);
              }}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-blue-500/25 flex items-center justify-center gap-3 group/btn"
            >
              <span>Create Coding Room</span>
              <span className="group-hover/btn:translate-x-1 transition-transform">→</span>
            </button>
          </div>

          {/* Join Room Card */}
          <div className="bg-gradient-to-br from-green-500/10 to-emerald-600/10 backdrop-blur-lg rounded-3xl p-8 border border-green-500/20 hover:border-green-400/40 transition-all duration-500 hover:shadow-2xl hover:shadow-green-500/20 group">
            <div className="flex items-center justify-between mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <span className="text-2xl text-white">👥</span>
              </div>
              <div className="text-green-400 text-sm font-mono px-3 py-1 bg-green-500/20 rounded-full">
                JOIN TEAM
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Join Existing Session</h2>
            <p className="text-green-100/80 mb-6 leading-relaxed">
              Enter a room ID to join your team's coding session. Collaborate seamlessly with real-time code sharing and editing.
            </p>
            <ul className="text-green-100/60 text-sm mb-8 space-y-2">
              <li className="flex items-center">
                <span className="text-green-400 mr-2">✓</span>
                Join with room ID from teammate
              </li>
              <li className="flex items-center">
                <span className="text-green-400 mr-2">✓</span>
                Real-time cursor sharing
              </li>
              <li className="flex items-center">
                <span className="text-green-400 mr-2">✓</span>
                Live chat and comments
              </li>
            </ul>
            <button
              onClick={() => {
                setMode("join");
                setShowModal(true);
              }}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-green-500/25 flex items-center justify-center gap-3 group/btn"
            >
              <span>Join Team Room</span>
              <span className="group-hover/btn:translate-x-1 transition-transform">→</span>
            </button>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="text-center mb-16">
          <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-8 border border-gray-700 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-white mb-4">Ready to Code Together?</h3>
            <p className="text-gray-300 mb-6">
              Join thousands of developers who collaborate seamlessly with CodeCollab
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <button
                onClick={() => {
                  setMode("create");
                  setShowModal(true);
                }}
                className="bg-white text-gray-900 hover:bg-gray-100 font-semibold py-3 px-8 rounded-xl transition-all duration-300 transform hover:scale-105"
              >
                Start Coding Now
              </button>
              <button className="border border-gray-600 text-gray-300 hover:border-gray-400 hover:text-white font-semibold py-3 px-8 rounded-xl transition-all duration-300">
                Learn More
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-gray-800 rounded-3xl shadow-2xl w-full max-w-md transform transition-all duration-500 scale-100 border border-gray-700">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <div>
                <h2 className="text-xl font-bold text-white">
                  {mode === "create" ? "Create New Room" : "Join Existing Room"}
                </h2>
                <p className="text-gray-400 text-sm mt-1">
                  {mode === "create" 
                    ? "Start a new coding session" 
                    : "Enter room details to join"
                  }
                </p>
              </div>
              <button
                onClick={() => !isLoading && setShowModal(false)}
                className="text-gray-400 hover:text-white transition-colors duration-200 disabled:opacity-50 p-2 hover:bg-gray-700 rounded-lg"
                disabled={isLoading}
              >
                <span className="text-2xl">×</span>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {mode === "join" && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Room ID
                  </label>
                  <input
                    type="text"
                    name="roomId"
                    value={formData.roomId}
                    onChange={handleChange}
                    required
                    placeholder="Paste room ID here..."
                    className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    disabled={isLoading}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Your Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Enter your full name"
                  className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Email Address <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="your.email@company.com"
                  className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                  disabled={isLoading}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-300 flex items-center justify-center gap-3 ${
                  mode === "create"
                    ? "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 disabled:from-blue-400 disabled:to-blue-400"
                    : "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 disabled:from-green-400 disabled:to-green-400"
                } ${isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:scale-105'}`}
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {mode === "create" ? "Creating Room..." : "Joining Room..."}
                  </>
                ) : (
                  <>
                    {mode === "create" ? (
                      <>
                        <span>🚀 Create Room</span>
                        <span className="group-hover:translate-x-1 transition-transform">→</span>
                      </>
                    ) : (
                      <>
                        <span>👥 Join Room</span>
                        <span className="group-hover:translate-x-1 transition-transform">→</span>
                      </>
                    )}
                  </>
                )}
              </button>
            </form>

            {/* Footer */}
            <div className="px-6 pb-6">
              <p className="text-xs text-gray-500 text-center">
                {mode === "create" 
                  ? "You'll be redirected to your new coding environment" 
                  : "Make sure you have the correct room ID from your team lead"
                }
              </p>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes drop {
          0% {
            transform: translateY(-100px) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 0.5;
          }
          90% {
            opacity: 0.5;
          }
          100% {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
          }
        }
        .animate-drop {
          animation: drop linear infinite;
        }
      `}</style>
    </div>
  );
} 
     <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 relative z-10">
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-2xl"
          <div className="px-4 py-2 bg-gray-900 border-b border-gray-700 flex items-center 
justify-between">
            <div className="flex items-center space-x-2">
              <div className="flex space-x-1">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
              <span className="text-sm text-gray-300">editor.js</span>
            </div>
            <div className="text-xs text-gray-400">
              {users.length} user{users.length !== 1 ? "s" : ""} editing
            </div>
          </div>
          {/* Monaco Editor - Force lower stacking context */}
          <div className="relative z-0">
            <Editor
              height="75vh"
              language="javascript"
              theme="vs-dark"
              value={code}
              onChange={handleCodeChange}
              options={{
                readOnly: roomStatus !== "active", // Read-only when paused/disabled
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
        {/* Quick Stats Footer */}
        <div className="mt-4 flex items-center justify-between text-sm text-gray-400">
          <div className="flex items-center space-x-4">
            <span>
              Connected to room:{" "}
              <strong className="text-gray-300">{roomId}</strong>
            </span>
            <span>•</span>
            <span>
              Language: <strong className="text-gray-300">JavaScript</strong>
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