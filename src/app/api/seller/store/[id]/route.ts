import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/config/db";
import Store from "@/models/store.model";
import User from "@/models/User";
import { verifyToken } from "@/lib/jwt";
import { successResponse, errorResponse } from "@/lib/response";
import { RESPONSE_MESSAGES } from "@/constants/responseMessages";
import cloudinary from "@/config/cloudinary";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(errorResponse("UNAUTHORIZED", RESPONSE_MESSAGES.STATUS_CODES.UNAUTHORIZED), { status: RESPONSE_MESSAGES.STATUS_CODES.UNAUTHORIZED });
    }
    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== "seller") {
      return NextResponse.json(errorResponse("FORBIDDEN", RESPONSE_MESSAGES.STATUS_CODES.FORBIDDEN), { status: RESPONSE_MESSAGES.STATUS_CODES.FORBIDDEN });
    }

    // Check if seller is approved
    const seller = await User.findById(decoded.id);
    if (!seller) {
      return NextResponse.json(errorResponse("NOT_FOUND", RESPONSE_MESSAGES.STATUS_CODES.NOT_FOUND, "Seller not found"), { status: RESPONSE_MESSAGES.STATUS_CODES.NOT_FOUND });
    }

    // Find the store to update
    const store = await Store.findOne({ _id: params.id, userId: decoded.id });
    if (!store) {
      return NextResponse.json(errorResponse("NOT_FOUND", RESPONSE_MESSAGES.STATUS_CODES.NOT_FOUND, "Store not found"), { status: RESPONSE_MESSAGES.STATUS_CODES.NOT_FOUND });
    }

    const { storeName, storeDescription, storeImageBase64 } = await req.json();
    let updateData: any = {};

    // Update store name if provided
    if (storeName) updateData.storeName = storeName;
    if (storeDescription !== undefined) updateData.storeDescription = storeDescription;

    // Upload new store image if provided
    if (storeImageBase64) {
      const uploaded = await cloudinary.uploader.upload(storeImageBase64, { folder: "stores" });
      updateData.storeImage = uploaded.secure_url;
    }

    // Update the store
    const updatedStore = await Store.findOneAndUpdate(
      { _id: params.id, userId: decoded.id },
      updateData,
      { new: true }
    );

    if (!updatedStore) {
      return NextResponse.json(errorResponse("NOT_FOUND", RESPONSE_MESSAGES.STATUS_CODES.NOT_FOUND, "Store not found"), { status: RESPONSE_MESSAGES.STATUS_CODES.NOT_FOUND });
    }

    return NextResponse.json(successResponse("UPDATE", updatedStore, RESPONSE_MESSAGES.STATUS_CODES.SUCCESS), { status: RESPONSE_MESSAGES.STATUS_CODES.SUCCESS });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong";
    return NextResponse.json(errorResponse("SERVER_ERROR", RESPONSE_MESSAGES.STATUS_CODES.SERVER_ERROR, message), { status: RESPONSE_MESSAGES.STATUS_CODES.SERVER_ERROR });
  }
}

// DELETE /api/seller/store/:id
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(errorResponse("UNAUTHORIZED", RESPONSE_MESSAGES.STATUS_CODES.UNAUTHORIZED), { status: RESPONSE_MESSAGES.STATUS_CODES.UNAUTHORIZED });
    }
    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== "seller") {
      return NextResponse.json(errorResponse("FORBIDDEN", RESPONSE_MESSAGES.STATUS_CODES.FORBIDDEN), { status: RESPONSE_MESSAGES.STATUS_CODES.FORBIDDEN });
    }

    // Check if seller is approved
    const seller = await User.findById(decoded.id);
    if (!seller) {
      return NextResponse.json(errorResponse("NOT_FOUND", RESPONSE_MESSAGES.STATUS_CODES.NOT_FOUND, "Seller not found"), { status: RESPONSE_MESSAGES.STATUS_CODES.NOT_FOUND });
    }

    // Find and delete the store
    const deletedStore = await Store.findOneAndDelete({ _id: params.id, userId: decoded.id });
    if (!deletedStore) {
      return NextResponse.json(errorResponse("NOT_FOUND", RESPONSE_MESSAGES.STATUS_CODES.NOT_FOUND, "Store not found"), { status: RESPONSE_MESSAGES.STATUS_CODES.NOT_FOUND });
    }

    return NextResponse.json(successResponse("DELETE", { message: "Store deleted successfully" }, RESPONSE_MESSAGES.STATUS_CODES.SUCCESS), { status: RESPONSE_MESSAGES.STATUS_CODES.SUCCESS });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong";
    return NextResponse.json(errorResponse("SERVER_ERROR", RESPONSE_MESSAGES.STATUS_CODES.SERVER_ERROR, message), { status: RESPONSE_MESSAGES.STATUS_CODES.SERVER_ERROR });
  }
}
  
