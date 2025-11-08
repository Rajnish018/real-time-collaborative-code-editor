"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function RoomModal({ show, onClose, onJoin, onCreate }) {
  const [roomId, setRoomId] = useState("");

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Modal container animation */}
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 150, damping: 15 }}
            className="bg-gray-900 border border-gray-700/60 rounded-2xl p-6 w-[90%] max-w-md shadow-2xl"
          >
            <h2 className="text-2xl font-semibold text-white text-center mb-4">
              Join or Create a Room
            </h2>

            <input
              type="text"
              placeholder="Enter Room ID to join..."
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="w-full mb-5 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />

            <div className="flex flex-col sm:flex-row gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  if (roomId.trim()) onJoin(roomId.trim());
                }}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded-lg shadow-md transition"
              >
                Join Room
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onCreate}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg shadow-md transition"
              >
                Create New Room
              </motion.button>
            </div>

            <motion.button
              whileHover={{ scale: 1.03 }}
              onClick={onClose}
              className="mt-6 text-gray-400 hover:text-gray-200 w-full text-center text-sm"
            >
              Cancel
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
