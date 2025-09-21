import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/config/db";
import Store from "@/models/store.model";
import { verifyToken } from "@/lib/jwt";
import { successResponse, errorResponse } from "@/lib/response";
import { RESPONSE_MESSAGES } from "@/constants/responseMessages";
import cloudinary from "@/config/cloudinary";

// POST /api/seller/store
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    // Auth check
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        errorResponse("UNAUTHORIZED", RESPONSE_MESSAGES.STATUS_CODES.UNAUTHORIZED),
        { status: RESPONSE_MESSAGES.STATUS_CODES.UNAUTHORIZED }
      );
    }
    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== "seller") {
      return NextResponse.json(
        errorResponse("FORBIDDEN", RESPONSE_MESSAGES.STATUS_CODES.FORBIDDEN),
        { status: RESPONSE_MESSAGES.STATUS_CODES.FORBIDDEN }
      );
    }

    const { storeName, storeDescription, storeImageBase64 } = await req.json();

    if (!storeName) {
      return NextResponse.json(
        errorResponse("VALIDATION_FAILED", RESPONSE_MESSAGES.STATUS_CODES.BAD_REQUEST, "Store name is required"),
        { status: RESPONSE_MESSAGES.STATUS_CODES.BAD_REQUEST }
      );
    }

    // Check if the seller already has a store
    const existingStore = await Store.findOne({ userId: decoded.id });
    if (existingStore) {
      return NextResponse.json(
        errorResponse("VALIDATION_FAILED", RESPONSE_MESSAGES.STATUS_CODES.BAD_REQUEST, "Store already exists"),
        { status: RESPONSE_MESSAGES.STATUS_CODES.BAD_REQUEST }
      );
    }

    // Upload image to Cloudinary if provided
    let storeImageUrl = "";
    if (storeImageBase64) {
      const uploaded = await cloudinary.uploader.upload(storeImageBase64, { folder: "stores" });
      storeImageUrl = uploaded.secure_url;
    }

    const store = await Store.create({
      userId: decoded.id,
      storeName,
      storeDescription,
      storeImage: storeImageUrl,
    });

    return NextResponse.json(
      successResponse("CREATE", store, RESPONSE_MESSAGES.STATUS_CODES.CREATED),
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


// GET /api/seller/store
export async function GET(req: NextRequest) {
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
      if (!decoded || decoded.role !== "seller") {
        return NextResponse.json(
          errorResponse("FORBIDDEN", RESPONSE_MESSAGES.STATUS_CODES.FORBIDDEN),
          { status: RESPONSE_MESSAGES.STATUS_CODES.FORBIDDEN }
        );
      }
  
      const store = await Store.find({ userId: decoded.id });
      if (!store) {
        return NextResponse.json(
          errorResponse("NOT_FOUND", RESPONSE_MESSAGES.STATUS_CODES.NOT_FOUND, "Store not found"),
          { status: RESPONSE_MESSAGES.STATUS_CODES.NOT_FOUND }
        );
      }
  
      return NextResponse.json(
        successResponse("FETCH", store, RESPONSE_MESSAGES.STATUS_CODES.SUCCESS),
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
  
