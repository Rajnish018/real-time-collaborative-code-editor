import mongoose from "mongoose";


let isConnected = false;

export const connectDB = async () => {
  if (isConnected) {
    console.log("MongoDB is already connected!!!!");
    return;
  }

  try {
    const MONGODB_URL = process.env.MONGODB_URL;

    console.log(MONGODB_URL)

    if (!MONGODB_URL) {
      throw new Error("MONGODB_URL is not defined in environment variables");
    }

    const db = await mongoose.connect(MONGODB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    isConnected = true;
    console.log(" MongoDB connected successfully:", db.connection.host);
  } catch (error) {
    console.error(" MongoDB connection error:", error.message);
    process.exit(1);
  }
};
