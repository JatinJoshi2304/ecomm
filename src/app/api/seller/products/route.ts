import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/config/db";
import Product from "@/models/product.model";
import Store from "@/models/store.model";
import { verifyToken } from "@/lib/jwt";
import { successResponse, errorResponse } from "@/lib/response";
import { RESPONSE_MESSAGES } from "@/constants/responseMessages";
import cloudinary from "@/config/cloudinary";

// POST /api/seller/products
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

    const {
      name,
      description,
      price,
      stock,
      category,
      brand,
      size,
      color,
      material,
      tags,
      imagesBase64,
    } = await req.json();

    if (!name || !price || !stock || !category || !brand) {
      return NextResponse.json(
        errorResponse("VALIDATION_FAILED", RESPONSE_MESSAGES.STATUS_CODES.BAD_REQUEST, "Missing required fields"),
        { status: RESPONSE_MESSAGES.STATUS_CODES.BAD_REQUEST }
      );
    }

    // Check if seller has a store
    const store = await Store.findOne({ userId: decoded.id });
    if (!store) {
      return NextResponse.json(
        errorResponse("NOT_FOUND", RESPONSE_MESSAGES.STATUS_CODES.NOT_FOUND, "Store not found"),
        { status: RESPONSE_MESSAGES.STATUS_CODES.NOT_FOUND }
      );
    }

    // Upload images to Cloudinary
    let uploadedImages: string[] = [];
    if (imagesBase64 && imagesBase64.length > 0) {
      for (const img of imagesBase64) {
        const uploaded = await cloudinary.uploader.upload(img, { folder: "products" });
        uploadedImages.push(uploaded.secure_url);
      }
    }

    const product = await Product.create({
      storeId: store._id,
      name,
      description,
      price,
      stock,
      category,
      brand,
      size,
      color,
      material,
      tags,
      images: uploadedImages,
    });

    return NextResponse.json(
      successResponse("CREATE", product, RESPONSE_MESSAGES.STATUS_CODES.CREATED),
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

// GET /api/seller/products
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
  
      const store = await Store.findOne({ userId: decoded.id });
      if (!store) {
        return NextResponse.json(
          errorResponse("NOT_FOUND", RESPONSE_MESSAGES.STATUS_CODES.NOT_FOUND, "Store not found"),
          { status: RESPONSE_MESSAGES.STATUS_CODES.NOT_FOUND }
        );
      }
  
      const products = await Product.find({ storeId: store._id })
        .populate("category brand size color material tags");
  
      return NextResponse.json(
        successResponse("FETCH", products, RESPONSE_MESSAGES.STATUS_CODES.SUCCESS),
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
  
