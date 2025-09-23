import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/config/db";
// import Category from "@/models/category.model";
import Product from "@/models/product.model";
import { successResponse, errorResponse } from "@/lib/response";
import { RESPONSE_MESSAGES } from "@/constants/responseMessages";

// GET /api/customer/products/related - Get all related product
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    // ✅ Extract query params instead of req.body (GET requests don’t have body)
    const { searchParams } = new URL(req.url);
    const tagsParam = searchParams.get("tags"); // e.g. ?tags=summer,casual
    const includeCount = searchParams.get("includeCount") === "true";

    const filter: any = {};

    if (tagsParam) {
      const tags = tagsParam.split(",").map(tag => tag.trim());
      filter.tags = { $in: tags }; // ✅ Find products that match any of the tags
    }

    const products = await Product.find(filter).sort({ name: 1 });

    const responseData: any = {
      products,
      count: products.length,
    };

    if (includeCount) {
      // ✅ Example: group count by tags
      const tagCounts = await Product.aggregate([
        { $unwind: "$tags" },
        { $match: { tags: { $in: tagsParam?.split(",") || [] } } },
        { $group: { _id: "$tags", count: { $sum: 1 } } },
      ]);

      responseData.tagCounts = tagCounts;
    }

    return NextResponse.json(
      successResponse("FETCH", responseData, RESPONSE_MESSAGES.STATUS_CODES.SUCCESS),
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
