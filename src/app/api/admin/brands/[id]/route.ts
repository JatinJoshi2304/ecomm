import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/config/db";
import Brand from "@/models/brand.model";
import { verifyToken } from "@/lib/jwt";
import { successResponse, errorResponse } from "@/lib/response";
import { RESPONSE_MESSAGES } from "@/constants/responseMessages";

// PATCH /api/admin/categories/:id
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();

    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        errorResponse("UNAUTHORIZED", RESPONSE_MESSAGES.STATUS_CODES.UNAUTHORIZED),
        { status: RESPONSE_MESSAGES.STATUS_CODES.UNAUTHORIZED }
      );
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json(
        errorResponse("FORBIDDEN", RESPONSE_MESSAGES.STATUS_CODES.FORBIDDEN),
        { status: RESPONSE_MESSAGES.STATUS_CODES.FORBIDDEN }
      );
    }

    const { id } = params;
    const { name, description, isActive } = await req.json();

    const brand = await Brand.findById(id);
    if (!brand) {
      return NextResponse.json(
        errorResponse("NOT_FOUND", RESPONSE_MESSAGES.STATUS_CODES.NOT_FOUND, "Category not found"),
        { status: RESPONSE_MESSAGES.STATUS_CODES.NOT_FOUND }
      );
    }

    if (name) brand.name = name;
    if (description !== undefined) brand.description = description;
    if (isActive !== undefined) brand.isActive = isActive;

    await brand.save();

    return NextResponse.json(
      successResponse("UPDATE", brand, RESPONSE_MESSAGES.STATUS_CODES.SUCCESS),
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


// DELETE /api/admin/categories/:id
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    try {
      await connectDB();
  
      const authHeader = req.headers.get("authorization");
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return NextResponse.json(
          errorResponse("UNAUTHORIZED", RESPONSE_MESSAGES.STATUS_CODES.UNAUTHORIZED),
          { status: RESPONSE_MESSAGES.STATUS_CODES.UNAUTHORIZED }
        );
      }
  
      const token = authHeader.split(" ")[1];
      const decoded = verifyToken(token);
      if (!decoded || decoded.role !== "admin") {
        return NextResponse.json(
          errorResponse("FORBIDDEN", RESPONSE_MESSAGES.STATUS_CODES.FORBIDDEN),
          { status: RESPONSE_MESSAGES.STATUS_CODES.FORBIDDEN }
        );
      }
  
      const { id } = params;
      const brand = await Brand.findById(id);
      if (!brand) {
        return NextResponse.json(
          errorResponse("NOT_FOUND", RESPONSE_MESSAGES.STATUS_CODES.NOT_FOUND, "Category not found"),
          { status: RESPONSE_MESSAGES.STATUS_CODES.NOT_FOUND }
        );
      }
  
      // Soft delete: you can also do hard delete with Category.findByIdAndDelete(id)
      brand.isActive = false;
      await brand.save();
  
      return NextResponse.json(
        successResponse("DELETE", brand, RESPONSE_MESSAGES.STATUS_CODES.SUCCESS),
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
  
