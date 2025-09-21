import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { connectDB } from "@/config/db";
import User from "@/models/User";
import { verifyToken } from "@/lib/jwt";
import { successResponse, errorResponse } from "@/lib/response";
import { RESPONSE_MESSAGES } from "@/constants/responseMessages";

// PATCH /api/customer/change-password - Change customer password
export async function PATCH(req: NextRequest) {
  try {
    await connectDB();

    // Auth check - Customer only
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        errorResponse("UNAUTHORIZED", RESPONSE_MESSAGES.STATUS_CODES.UNAUTHORIZED),
        { status: RESPONSE_MESSAGES.STATUS_CODES.UNAUTHORIZED }
      );
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== "customer") {
      return NextResponse.json(
        errorResponse("FORBIDDEN", RESPONSE_MESSAGES.STATUS_CODES.FORBIDDEN),
        { status: RESPONSE_MESSAGES.STATUS_CODES.FORBIDDEN }
      );
    }

    const { currentPassword, newPassword } = await req.json();

    // Validate input
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        errorResponse(
          "VALIDATION_FAILED",
          RESPONSE_MESSAGES.STATUS_CODES.BAD_REQUEST,
          "Current password and new password are required"
        ),
        { status: RESPONSE_MESSAGES.STATUS_CODES.BAD_REQUEST }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        errorResponse(
          "VALIDATION_FAILED",
          RESPONSE_MESSAGES.STATUS_CODES.BAD_REQUEST,
          "New password must be at least 6 characters long"
        ),
        { status: RESPONSE_MESSAGES.STATUS_CODES.BAD_REQUEST }
      );
    }

    // Find the customer
    const customer = await User.findById(decoded.id);
    if (!customer) {
      return NextResponse.json(
        errorResponse("NOT_FOUND", RESPONSE_MESSAGES.STATUS_CODES.NOT_FOUND, "Customer not found"),
        { status: RESPONSE_MESSAGES.STATUS_CODES.NOT_FOUND }
      );
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, customer.password);
    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        errorResponse(
          "VALIDATION_FAILED",
          RESPONSE_MESSAGES.STATUS_CODES.BAD_REQUEST,
          "Current password is incorrect"
        ),
        { status: RESPONSE_MESSAGES.STATUS_CODES.BAD_REQUEST }
      );
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    customer.password = hashedNewPassword;
    await customer.save();

    return NextResponse.json(
      successResponse(
        "UPDATE",
        { message: "Password changed successfully" },
        RESPONSE_MESSAGES.STATUS_CODES.SUCCESS
      ),
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
