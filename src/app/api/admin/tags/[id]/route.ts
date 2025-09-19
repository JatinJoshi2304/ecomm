import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/config/db";
import Tag from "@/models/tag.model";
import { verifyToken } from "@/lib/jwt";
import { successResponse, errorResponse } from "@/lib/response";
import { RESPONSE_MESSAGES } from "@/constants/responseMessages";

// PATCH /api/admin/tags/:id
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
    const { name, type, isActive } = await req.json();

    const tag = await Tag.findById(id);
    if (!tag) return NextResponse.json(errorResponse("NOT_FOUND", RESPONSE_MESSAGES.STATUS_CODES.NOT_FOUND, "Tag not found"), { status: RESPONSE_MESSAGES.STATUS_CODES.NOT_FOUND });

    if (name) tag.name = name;
    if (type !== undefined) tag.type = type;
    if (isActive !== undefined) tag.isActive = isActive;

    const duplicate = await Tag.findOne({ _id: { $ne: id }, name });
    if (duplicate) return NextResponse.json(errorResponse("VALIDATION_FAILED", RESPONSE_MESSAGES.STATUS_CODES.BAD_REQUEST, "Tag already exists"), { status: RESPONSE_MESSAGES.STATUS_CODES.BAD_REQUEST });

    await tag.save();
    return NextResponse.json(successResponse("UPDATE", tag, RESPONSE_MESSAGES.STATUS_CODES.SUCCESS), { status: RESPONSE_MESSAGES.STATUS_CODES.SUCCESS });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong";
    return NextResponse.json(errorResponse("SERVER_ERROR", RESPONSE_MESSAGES.STATUS_CODES.SERVER_ERROR, message), { status: RESPONSE_MESSAGES.STATUS_CODES.SERVER_ERROR });
  }
}

// DELETE /api/admin/tags/:id
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
    const tag = await Tag.findById(id);
    if (!tag) return NextResponse.json(errorResponse("NOT_FOUND", RESPONSE_MESSAGES.STATUS_CODES.NOT_FOUND, "Tag not found"), { status: RESPONSE_MESSAGES.STATUS_CODES.NOT_FOUND });

    tag.isActive = false; // soft delete
    await tag.save();
    return NextResponse.json(successResponse("DELETE", tag, RESPONSE_MESSAGES.STATUS_CODES.SUCCESS), { status: RESPONSE_MESSAGES.STATUS_CODES.SUCCESS });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong";
    return NextResponse.json(errorResponse("SERVER_ERROR", RESPONSE_MESSAGES.STATUS_CODES.SERVER_ERROR, message), { status: RESPONSE_MESSAGES.STATUS_CODES.SERVER_ERROR });
  }
}
