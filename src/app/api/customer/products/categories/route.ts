import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/config/db";
import Category from "@/models/category.model";
import Product from "@/models/product.model";
import { successResponse, errorResponse } from "@/lib/response";
import { RESPONSE_MESSAGES } from "@/constants/responseMessages";

// GET /api/customer/products/categories - Get all categories with product counts
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const url = new URL(req.url);
    const includeCount = url.searchParams.get("includeCount") === "true";

    // Get all active categories
    const categories = await Category.find({ isActive: true })
      .sort({ name: 1 });

    let categoriesWithCount = categories;

    // Add product count if requested
    if (includeCount) {
      categoriesWithCount = await Promise.all(
        categories.map(async (category) => {
          const productCount = await Product.countDocuments({
            category: category._id,
            isActive: true,
          });

          return {
            id: category._id,
            name: category.name,
            description: category.description,
            productCount,
            createdAt: category.createdAt,
            updatedAt: category.updatedAt,
          };
        })
      );
    } else {
      categoriesWithCount = categories.map(category => ({
        id: category._id,
        name: category.name,
        description: category.description,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
      }));
    }

    return NextResponse.json(
      successResponse(
        "FETCH",
        {
          categories: categoriesWithCount,
          count: categoriesWithCount.length,
        },
        RESPONSE_MESSAGES.STATUS_CODES.SUCCESS
      ),
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
