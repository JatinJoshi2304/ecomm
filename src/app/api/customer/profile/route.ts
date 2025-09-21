import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/config/db";
import User from "@/models/User";
import { verifyToken } from "@/lib/jwt";
import { successResponse, errorResponse } from "@/lib/response";
import { RESPONSE_MESSAGES } from "@/constants/responseMessages";

// GET /api/customer/profile - Get customer profile
export async function GET(req: NextRequest) {
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

    // Find the customer
    const customer = await User.findById(decoded.id).select("-password");
    if (!customer) {
      return NextResponse.json(
        errorResponse("NOT_FOUND", RESPONSE_MESSAGES.STATUS_CODES.NOT_FOUND, "Customer not found"),
        { status: RESPONSE_MESSAGES.STATUS_CODES.NOT_FOUND }
      );
    }

    return NextResponse.json(
      successResponse(
        "FETCH",
        {
          id: customer._id,
          name: customer.name,
          email: customer.email,
          role: customer.role,
          createdAt: customer.createdAt,
          updatedAt: customer.updatedAt
        },
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

// PATCH /api/customer/profile - Update customer profile
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

    const { name, email } = await req.json();

    // Find the customer
    const customer = await User.findById(decoded.id);
    if (!customer) {
      return NextResponse.json(
        errorResponse("NOT_FOUND", RESPONSE_MESSAGES.STATUS_CODES.NOT_FOUND, "Customer not found"),
        { status: RESPONSE_MESSAGES.STATUS_CODES.NOT_FOUND }
      );
    }

    // Check if email is being changed and if it already exists
    if (email && email !== customer.email) {
      const existingUser = await User.findOne({ email, _id: { $ne: decoded.id } });
      if (existingUser) {
        return NextResponse.json(
          errorResponse(
            "VALIDATION_FAILED",
            RESPONSE_MESSAGES.STATUS_CODES.BAD_REQUEST,
            "Email already exists"
          ),
          { status: RESPONSE_MESSAGES.STATUS_CODES.BAD_REQUEST }
        );
      }
    }

    // Update customer profile
    if (name) customer.name = name;
    if (email) customer.email = email;

    await customer.save();

    // Return updated profile without password
    const updatedCustomer = await User.findById(decoded.id).select("-password");

    return NextResponse.json(
      successResponse(
        "UPDATE",
        {
          id: updatedCustomer!._id,
          name: updatedCustomer!.name,
          email: updatedCustomer!.email,
          role: updatedCustomer!.role,
          createdAt: updatedCustomer!.createdAt,
          updatedAt: updatedCustomer!.updatedAt
        },
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
