import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/config/db";
import Size from "@/models/size.model";
import { verifyToken } from "@/lib/jwt";
import { successResponse, errorResponse } from "@/lib/response";
import { RESPONSE_MESSAGES } from "@/constants/responseMessages";

// POST /api/admin/sizes
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    // ✅ Auth check
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

    // ✅ Request body
    const { name, type, description } = await req.json();

    if (!name || !type) {
      return NextResponse.json(
        errorResponse(
          "VALIDATION_FAILED",
          RESPONSE_MESSAGES.STATUS_CODES.BAD_REQUEST,
          "Name and type are required"
        ),
        { status: RESPONSE_MESSAGES.STATUS_CODES.BAD_REQUEST }
      );
    }

    // ✅ Check for duplicate size for the same type
    const existingSize = await Size.findOne({ name, type });
    if (existingSize) {
      return NextResponse.json(
        errorResponse(
          "VALIDATION_FAILED",
          RESPONSE_MESSAGES.STATUS_CODES.BAD_REQUEST,
          `Size "${name}" already exists for type "${type}"`
        ),
        { status: RESPONSE_MESSAGES.STATUS_CODES.BAD_REQUEST }
      );
    }

    // ✅ Create size
    const size = await Size.create({ name, type, description });

    return NextResponse.json(
      successResponse("CREATE", size, RESPONSE_MESSAGES.STATUS_CODES.CREATED),
      { status: RESPONSE_MESSAGES.STATUS_CODES.CREATED }
    );

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong";
    return NextResponse.json(
      errorResponse("SERVER_ERROR", RESPONSE_MESSAGES.STATUS_CODES.SERVER_ERROR, message),
      { status: RESPONSE_MESSAGES.STATUS_CODES.SERVER_ERROR }
    );
  }
}

// GET /api/admin/sizes?type=clothing
export async function GET(req: NextRequest) {
    try {
      await connectDB();
  
      // ✅ Auth check
      const authHeader = req.headers.get("authorization");
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return NextResponse.json(
          errorResponse("UNAUTHORIZED", RESPONSE_MESSAGES.STATUS_CODES.UNAUTHORIZED),
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
  
      // ✅ Optional query param for filtering by type
      const url = new URL(req.url);
      const typeFilter = url.searchParams.get("type");
  
      const query: any = { isActive: true };
      if (typeFilter) query.type = typeFilter;
  
      const sizes = await Size.find(query).sort({ createdAt: -1 });
  
      return NextResponse.json(
        successResponse("FETCH", sizes, RESPONSE_MESSAGES.STATUS_CODES.SUCCESS),
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
  
