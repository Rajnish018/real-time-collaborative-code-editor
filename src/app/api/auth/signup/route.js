import { connectDB } from "../../db/db";
import User from "../../model/user.model";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { generateToken } from "../../lib/JWT_Token.js";

export async function POST(req) {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
      agreeToTerms,
    } = await req.json();

    // Validate input
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      return NextResponse.json({ message: "All fields are required" }, { status: 400 });
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ message: "Passwords do not match" }, { status: 400 });
    }

    if (!agreeToTerms) {
      return NextResponse.json(
        { message: "You must agree to the terms and conditions" },
        { status: 400 }
      );
    }

    await connectDB();

    //  Check existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ message: "User already exists" }, { status: 409 });
    }

    //  Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      agreeToTerms,
      provider: "local",
    });

    if (!newUser) {
      return NextResponse.json({ message: "Failed to create user" }, { status: 500 });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateToken(newUser);

    // Hash and store refresh token in DB
    newUser.refreshToken = await bcrypt.hash(refreshToken, 10);
    await newUser.save({ validateBeforeSave: false });

    //  Create response + cookie
    const response = NextResponse.json(
      {
        message: "User created successfully",
        user: {
          _id: newUser._id,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
        },
        accessToken,
      },
      { status: 201 }
    );

    response.cookies.set("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error) {
    console.error("Error during signup:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
