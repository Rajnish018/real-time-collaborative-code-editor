import mongoose from "mongoose";

const roomSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true },
  code: { type: String, default: "" },
  members: { type: Array, default: [] },
  status: {
    type: String,
    enum: ["active", "paused", "disabled", "archived"],
    default: "active",
  },
  resumedFrom: { type: String },
  roomHistory: [
    {
      code: String,
      savedAt: { type: Date, default: Date.now },
    },
  ],
  disabledAt: Date,
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model("Room", roomSchema);
