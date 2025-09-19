import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/config/db";
import Material from "@/models/material.model";
import { verifyToken } from "@/lib/jwt";
import { errorResponse, successResponse } from "@/lib/response";
import { RESPONSE_MESSAGES } from "@/constants/responseMessages";

// PATCH /api/admin/materials/:id
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
    const { name, description, isActive } = await req.json();

    const material = await Material.findById(id);
    if (!material) return NextResponse.json(errorResponse("NOT_FOUND", RESPONSE_MESSAGES.STATUS_CODES.NOT_FOUND, "Material not found"), { status: RESPONSE_MESSAGES.STATUS_CODES.NOT_FOUND });

    if (name) material.name = name;
    if (description !== undefined) material.description = description;
    if (isActive !== undefined) material.isActive = isActive;

    const duplicate = await Material.findOne({ _id: { $ne: id }, name });
    if (duplicate) return NextResponse.json(errorResponse("VALIDATION_FAILED", RESPONSE_MESSAGES.STATUS_CODES.BAD_REQUEST, "Material already exists"), { status: RESPONSE_MESSAGES.STATUS_CODES.BAD_REQUEST });

    await material.save();
    return NextResponse.json(successResponse("UPDATE", material, RESPONSE_MESSAGES.STATUS_CODES.SUCCESS), { status: RESPONSE_MESSAGES.STATUS_CODES.SUCCESS });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong";
    return NextResponse.json(errorResponse("SERVER_ERROR", RESPONSE_MESSAGES.STATUS_CODES.SERVER_ERROR, message), { status: RESPONSE_MESSAGES.STATUS_CODES.SERVER_ERROR });
  }
}

// DELETE /api/admin/materials/:id
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
    const material = await Material.findById(id);
    if (!material) return NextResponse.json(errorResponse("NOT_FOUND", RESPONSE_MESSAGES.STATUS_CODES.NOT_FOUND, "Material not found"), { status: RESPONSE_MESSAGES.STATUS_CODES.NOT_FOUND });

    material.isActive = false; // soft delete
    await material.save();
    return NextResponse.json(successResponse("DELETE", material, RESPONSE_MESSAGES.STATUS_CODES.SUCCESS), { status: RESPONSE_MESSAGES.STATUS_CODES.SUCCESS });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong";
    return NextResponse.json(errorResponse("SERVER_ERROR", RESPONSE_MESSAGES.STATUS_CODES.SERVER_ERROR, message), { status: RESPONSE_MESSAGES.STATUS_CODES.SERVER_ERROR });
  }
}
