import { NextResponse } from "next/server";
import { connectDB } from "../../db/db";
import { cookies } from "next/headers";
import User from "../../model/user.model";
import bcrypt from "bcryptjs";
import { generateToken } from "../../lib/JWT_Token.js";

export async function POST(req) {
  const { email, password } = await req.json();

  console.log("Login attempt for email:", email);
  console.log("password:", password ? "******" : "not provided");

  if (!email || !password) {
    return NextResponse.json(
      { message: "Email and password are required" },
      { status: 400 }
    );
  }

  await connectDB();

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json({ message: "Invalid password" }, { status: 401 });
    }

    const { accessToken, refreshToken } = generateToken(user);

    //  Fixed for Next.js 15.5+
    const cookieStore = await cookies(); // must await before using
    cookieStore.set({
      name: "refreshToken",
      value: refreshToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return NextResponse.json(
      {
        message: "Login successful",
        accessToken,
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error during login:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
