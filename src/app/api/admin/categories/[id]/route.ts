import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/config/db";
import Category from "@/models/category.model";
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

    const category = await Category.findById(id);
    if (!category) {
      return NextResponse.json(
        errorResponse("NOT_FOUND", RESPONSE_MESSAGES.STATUS_CODES.NOT_FOUND, "Category not found"),
        { status: RESPONSE_MESSAGES.STATUS_CODES.NOT_FOUND }
      );
    }

    if (name) category.name = name;
    if (description !== undefined) category.description = description;
    if (isActive !== undefined) category.isActive = isActive;

    await category.save();

    return NextResponse.json(
      successResponse("UPDATE", category, RESPONSE_MESSAGES.STATUS_CODES.SUCCESS),
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
      const category = await Category.findById(id);
      if (!category) {
        return NextResponse.json(
          errorResponse("NOT_FOUND", RESPONSE_MESSAGES.STATUS_CODES.NOT_FOUND, "Category not found"),
          { status: RESPONSE_MESSAGES.STATUS_CODES.NOT_FOUND }
        );
      }
  
      // Soft delete: you can also do hard delete with Category.findByIdAndDelete(id)
      category.isActive = false;
      await category.save();
  
      return NextResponse.json(
        successResponse("DELETE", category, RESPONSE_MESSAGES.STATUS_CODES.SUCCESS),
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
  
