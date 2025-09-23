import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/config/db";
import Color from "@/models/color.model";
import { successResponse, errorResponse } from "@/lib/response";
import { RESPONSE_MESSAGES } from "@/constants/responseMessages";

// GET /api/seller/colors - Get all colors
export async function GET() {
  try {
    await connectDB();

    const colors = await Color.find().sort({ name: 1 });

    return NextResponse.json(
      successResponse("FETCH", { colors }, RESPONSE_MESSAGES.STATUS_CODES.SUCCESS),
      { status: RESPONSE_MESSAGES.STATUS_CODES.SUCCESS }
    );

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong";
    return NextResponse.json(
      errorResponse("SERVER_ERROR", RESPONSE_MESSAGES.STATUS_CODES.SERVER_ERROR, message),
      { status: RESPONSE_MESSAGES.STATUS_CODES.SERVER_ERROR }
    );
  }
}
