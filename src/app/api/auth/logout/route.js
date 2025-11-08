import { connectDB } from "../../db/db.js";
import User from "../../model/user.model.js";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    await connectDB();

    // Parse user info from cookie or access token if needed
    // Example: extract userId from token (if you include it in req headers)
    // const token = req.cookies.get("refreshToken")?.value;
    // const userId = verifyToken(token)?.id;

    // Optional: clear refresh token in DB
    // await User.findByIdAndUpdate(userId, { refreshToken: null });

    const response = NextResponse.json(
      { message: "Logged out successfully" },
      { status: 200 }
    );

    // Clear the cookie
    response.cookies.set("refreshToken", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      expires: new Date(0),
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Logout Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
