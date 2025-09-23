import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/config/db";
import Product from "@/models/product.model";
import Store from "@/models/store.model";
import { verifyToken } from "@/lib/jwt";
import { successResponse, errorResponse } from "@/lib/response";
import { RESPONSE_MESSAGES } from "@/constants/responseMessages";
import cloudinary from "@/config/cloudinary";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(errorResponse("UNAUTHORIZED", RESPONSE_MESSAGES.STATUS_CODES.UNAUTHORIZED), { status: RESPONSE_MESSAGES.STATUS_CODES.UNAUTHORIZED });
    }
    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== "seller") {
      return NextResponse.json(errorResponse("FORBIDDEN", RESPONSE_MESSAGES.STATUS_CODES.FORBIDDEN), { status: RESPONSE_MESSAGES.STATUS_CODES.FORBIDDEN });
    }

    const store = await Store.findOne({ userId: decoded.id });
    if (!store) {
      return NextResponse.json(errorResponse("NOT_FOUND", RESPONSE_MESSAGES.STATUS_CODES.NOT_FOUND, "Store not found"), { status: RESPONSE_MESSAGES.STATUS_CODES.NOT_FOUND });
    }

    const body = await req.json();
    const updateData = { ...body };

    // Upload new images if provided
    if (body.imagesBase64 && body.imagesBase64.length > 0) {
      const uploadedImages: string[] = [];
      for (const img of body.imagesBase64) {
        const uploaded = await cloudinary.uploader.upload(img, { folder: "products" });
        uploadedImages.push(uploaded.secure_url);
      }
      updateData.images = uploadedImages;
      delete updateData.imagesBase64;
    }

    const product = await Product.findOneAndUpdate(
      { _id: id, storeId: store._id },
      updateData,
      { new: true }
    );

    if (!product) {
      return NextResponse.json(errorResponse("NOT_FOUND", RESPONSE_MESSAGES.STATUS_CODES.NOT_FOUND, "Product not found"), { status: RESPONSE_MESSAGES.STATUS_CODES.NOT_FOUND });
    }

    return NextResponse.json(successResponse("UPDATE", product, RESPONSE_MESSAGES.STATUS_CODES.SUCCESS), { status: RESPONSE_MESSAGES.STATUS_CODES.SUCCESS });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong";
    return NextResponse.json(errorResponse("SERVER_ERROR", RESPONSE_MESSAGES.STATUS_CODES.SERVER_ERROR, message), { status: RESPONSE_MESSAGES.STATUS_CODES.SERVER_ERROR });
  }
}

// DELETE /api/seller/products/:id
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
      await connectDB();
      const { id } = await params;
      const authHeader = req.headers.get("authorization");
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return NextResponse.json(errorResponse("UNAUTHORIZED", RESPONSE_MESSAGES.STATUS_CODES.UNAUTHORIZED), { status: RESPONSE_MESSAGES.STATUS_CODES.UNAUTHORIZED });
      }
      const token = authHeader.split(" ")[1];
      const decoded = verifyToken(token);
      if (!decoded || decoded.role !== "seller") {
        return NextResponse.json(errorResponse("FORBIDDEN", RESPONSE_MESSAGES.STATUS_CODES.FORBIDDEN), { status: RESPONSE_MESSAGES.STATUS_CODES.FORBIDDEN });
      }
  
      const store = await Store.findOne({ userId: decoded.id });
      if (!store) {
        return NextResponse.json(errorResponse("NOT_FOUND", RESPONSE_MESSAGES.STATUS_CODES.NOT_FOUND, "Store not found"), { status: RESPONSE_MESSAGES.STATUS_CODES.NOT_FOUND });
      }
  
      const deleted = await Product.findOneAndDelete({ _id: id, storeId: store._id });
      if (!deleted) {
        return NextResponse.json(errorResponse("NOT_FOUND", RESPONSE_MESSAGES.STATUS_CODES.NOT_FOUND, "Product not found"), { status: RESPONSE_MESSAGES.STATUS_CODES.NOT_FOUND });
      }
  
      return NextResponse.json(successResponse("DELETE", {}, RESPONSE_MESSAGES.STATUS_CODES.SUCCESS), { status: RESPONSE_MESSAGES.STATUS_CODES.SUCCESS });
  
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Something went wrong";
      return NextResponse.json(errorResponse("SERVER_ERROR", RESPONSE_MESSAGES.STATUS_CODES.SERVER_ERROR, message), { status: RESPONSE_MESSAGES.STATUS_CODES.SERVER_ERROR });
    }
  }
  
