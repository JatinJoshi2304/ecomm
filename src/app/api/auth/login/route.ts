import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "@/models/User";
import { connectDB } from "@/config/db";
import { errorResponse, successResponse } from "@/lib/response";
import { RESPONSE_MESSAGES } from "@/constants/responseMessages";
import "@/models/index";
import { mergeGuestCartWithUserCart } from "@/lib/cartHelpers";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { email, password,sessionId } = await req.json();
console.log("Login Session :::::",sessionId);
    // find user
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 400 });
    }

    // check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 400 });
    }

    // create token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: "1d" }
    );

    const mergedCart = await mergeGuestCartWithUserCart(sessionId, user._id);
    if(mergedCart){
      console.log("Cart Merge Successfull")
    }
    return NextResponse.json(
      successResponse(
        "FETCH",
        {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          token,
        },
        RESPONSE_MESSAGES.STATUS_CODES.SUCCESS
      ),
      { status: RESPONSE_MESSAGES.STATUS_CODES.SUCCESS }
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Something went wrong";
  
    return NextResponse.json(
      errorResponse(
        "SERVER_ERROR",
        RESPONSE_MESSAGES.STATUS_CODES.SERVER_ERROR,
        message
      ),
      { status: RESPONSE_MESSAGES.STATUS_CODES.SERVER_ERROR }
    );
  }
}
