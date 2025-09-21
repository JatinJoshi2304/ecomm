import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { connectDB } from "@/config/db";
import User from "@/models/User";
import { verifyToken } from "@/lib/jwt";
import { successResponse, errorResponse } from "@/lib/response";
import { RESPONSE_MESSAGES } from "@/constants/responseMessages";

// DELETE /api/customer/delete-account - Delete customer account
export async function DELETE(req: NextRequest) {
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

    const { password } = await req.json();

    // Validate input
    if (!password) {
      return NextResponse.json(
        errorResponse(
          "VALIDATION_FAILED",
          RESPONSE_MESSAGES.STATUS_CODES.BAD_REQUEST,
          "Password is required to delete account"
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

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, customer.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        errorResponse(
          "VALIDATION_FAILED",
          RESPONSE_MESSAGES.STATUS_CODES.BAD_REQUEST,
          "Password is incorrect"
        ),
        { status: RESPONSE_MESSAGES.STATUS_CODES.BAD_REQUEST }
      );
    }

    // Delete customer account
    await User.findByIdAndDelete(decoded.id);

    return NextResponse.json(
      successResponse(
        "DELETE",
        { message: "Account deleted successfully" },
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
