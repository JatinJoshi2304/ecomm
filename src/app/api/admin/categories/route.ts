import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/config/db";
import Category from "@/models/category.model";
import { verifyToken } from "@/lib/jwt";
import { successResponse, errorResponse } from "@/lib/response";
import { RESPONSE_MESSAGES } from "@/constants/responseMessages";

// POST /api/admin/categories
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    // ✅ Auth check
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        errorResponse(
          "UNAUTHORIZED",
          RESPONSE_MESSAGES.STATUS_CODES.UNAUTHORIZED
        ),
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

    // ✅ Get data from request
    const { name, description } = await req.json();

    if (!name) {
      return NextResponse.json(
        errorResponse(
          "VALIDATION_FAILED",
          RESPONSE_MESSAGES.STATUS_CODES.BAD_REQUEST,
          "Name is required"
        ),
        { status: RESPONSE_MESSAGES.STATUS_CODES.BAD_REQUEST }
      );
    }

    // ✅ Check if category already exists
    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      return NextResponse.json(
        errorResponse(
          "VALIDATION_FAILED",
          RESPONSE_MESSAGES.STATUS_CODES.BAD_REQUEST,
          "Category already exists"
        ),
        { status: RESPONSE_MESSAGES.STATUS_CODES.BAD_REQUEST }
      );
    }

    // ✅ Create category
    const category = await Category.create({ name, description });

    return NextResponse.json(
      successResponse(
        "CREATE",
        category,
        RESPONSE_MESSAGES.STATUS_CODES.CREATED
      ),
      { status: RESPONSE_MESSAGES.STATUS_CODES.CREATED }
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Something went wrong";
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

// GET /api/admin/categories
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        errorResponse(
          "UNAUTHORIZED",
          RESPONSE_MESSAGES.STATUS_CODES.UNAUTHORIZED
        ),
        { status: RESPONSE_MESSAGES.STATUS_CODES.UNAUTHORIZED }
      );
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);
    if (!decoded || (decoded.role !== "admin" && decoded.role !== "seller")) {
        return NextResponse.json(
          errorResponse("FORBIDDEN", RESPONSE_MESSAGES.STATUS_CODES.FORBIDDEN),
          { status: RESPONSE_MESSAGES.STATUS_CODES.FORBIDDEN }
        );
      }

    // const categories = await Category.find({isActive:true}).sort({ createdAt: -1 });
    const categories = await Category.find().sort({ createdAt: -1 });

    return NextResponse.json(
      successResponse(
        "FETCH",
        categories,
        RESPONSE_MESSAGES.STATUS_CODES.SUCCESS
      ),
      { status: RESPONSE_MESSAGES.STATUS_CODES.SUCCESS }
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Something went wrong";
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
