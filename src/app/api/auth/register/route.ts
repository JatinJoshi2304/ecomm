import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import User from "@/models/User";
import { connectDB } from "@/config/db";
import { errorResponse, successResponse } from "@/lib/response";
import { RESPONSE_MESSAGES } from "@/constants/responseMessages";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { name, email, password, role } = await req.json();

    // check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 });
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || "customer",
    });

    return NextResponse.json(
      successResponse(
        "CREATE",
        {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        RESPONSE_MESSAGES.STATUS_CODES.CREATED
      ),
      { status: RESPONSE_MESSAGES.STATUS_CODES.CREATED }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong";

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
