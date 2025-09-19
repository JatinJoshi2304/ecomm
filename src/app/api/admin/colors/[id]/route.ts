import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/config/db";
import Color from "@/models/color.model";
import { verifyToken } from "@/lib/jwt";
import { errorResponse, successResponse } from "@/lib/response";
import { RESPONSE_MESSAGES } from "@/constants/responseMessages";

// PATCH /api/admin/colors/:id
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(errorResponse("UNAUTHORIZED", RESPONSE_MESSAGES.STATUS_CODES.UNAUTHORIZED), { status: RESPONSE_MESSAGES.STATUS_CODES.UNAUTHORIZED });
    }
    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json(errorResponse("FORBIDDEN", RESPONSE_MESSAGES.STATUS_CODES.FORBIDDEN), { status: RESPONSE_MESSAGES.STATUS_CODES.FORBIDDEN });
    }

    const { id } = params;
    const { name, hexCode, isActive } = await req.json();

    const color = await Color.findById(id);
    if (!color) return NextResponse.json(errorResponse("NOT_FOUND", RESPONSE_MESSAGES.STATUS_CODES.NOT_FOUND, "Color not found"), { status: RESPONSE_MESSAGES.STATUS_CODES.NOT_FOUND });

    if (name) color.name = name;
    if (hexCode !== undefined) color.hexCode = hexCode;
    if (isActive !== undefined) color.isActive = isActive;

    // Check duplicate
    const duplicate = await Color.findOne({ _id: { $ne: id }, name });
    if (duplicate) return NextResponse.json(errorResponse("VALIDATION_FAILED", RESPONSE_MESSAGES.STATUS_CODES.BAD_REQUEST, "Color already exists"), { status: RESPONSE_MESSAGES.STATUS_CODES.BAD_REQUEST });

    await color.save();
    return NextResponse.json(successResponse("UPDATE", color, RESPONSE_MESSAGES.STATUS_CODES.SUCCESS), { status: RESPONSE_MESSAGES.STATUS_CODES.SUCCESS });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong";
    return NextResponse.json(errorResponse("SERVER_ERROR", RESPONSE_MESSAGES.STATUS_CODES.SERVER_ERROR, message), { status: RESPONSE_MESSAGES.STATUS_CODES.SERVER_ERROR });
  }
}

// DELETE /api/admin/colors/:id
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(errorResponse("UNAUTHORIZED", RESPONSE_MESSAGES.STATUS_CODES.UNAUTHORIZED), { status: RESPONSE_MESSAGES.STATUS_CODES.UNAUTHORIZED });
    }
    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json(errorResponse("FORBIDDEN", RESPONSE_MESSAGES.STATUS_CODES.FORBIDDEN), { status: RESPONSE_MESSAGES.STATUS_CODES.FORBIDDEN });
    }

    const { id } = params;
    const color = await Color.findById(id);
    if (!color) return NextResponse.json(errorResponse("NOT_FOUND", RESPONSE_MESSAGES.STATUS_CODES.NOT_FOUND, "Color not found"), { status: RESPONSE_MESSAGES.STATUS_CODES.NOT_FOUND });

    color.isActive = false; // soft delete
    await color.save();
    return NextResponse.json(successResponse("DELETE", color, RESPONSE_MESSAGES.STATUS_CODES.SUCCESS), { status: RESPONSE_MESSAGES.STATUS_CODES.SUCCESS });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong";
    return NextResponse.json(errorResponse("SERVER_ERROR", RESPONSE_MESSAGES.STATUS_CODES.SERVER_ERROR, message), { status: RESPONSE_MESSAGES.STATUS_CODES.SERVER_ERROR });
  }
}
