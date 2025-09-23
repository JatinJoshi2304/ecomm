import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/config/db";
import Product from "@/models/product.model";
import Category from "@/models/category.model";
import { successResponse, errorResponse } from "@/lib/response";
import { RESPONSE_MESSAGES } from "@/constants/responseMessages";

// GET /api/customer/products/category/[id] - Get products by category
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();

    const url = new URL(req.url);
    const sortBy = url.searchParams.get("sortBy") || "createdAt";
    const sortOrder = url.searchParams.get("sortOrder") || "desc";
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "12");
    const skip = (page - 1) * limit;

    const { id } = await params;

    // Verify category exists
    const category = await Category.findById(id);
    if (!category || !category.isActive) {
      return NextResponse.json(
        errorResponse("NOT_FOUND", RESPONSE_MESSAGES.STATUS_CODES.NOT_FOUND, "Category not found"),
        { status: RESPONSE_MESSAGES.STATUS_CODES.NOT_FOUND }
      );
    }

    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    // Get products in this category
    const products = await Product.find({
      category: id,
      isActive: true,
    })
      .populate("category", "name")
      .populate("brand", "name")
      .populate("size", "name type")
      .populate("color", "name hexCode")
      .populate("material", "name")
      .populate("tags", "name type")
      .populate("storeId", "storeName storeImage")
      .sort(sort)
      .skip(skip)
      .limit(limit);

    // Get total count
    const totalCount = await Product.countDocuments({
      category: id,
      isActive: true,
    });

    // Format products
    const formattedProducts = products.map(product => ({
      id: product._id,
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      images: product.images,
      averageRating: product.averageRating,
      reviewCount: product.reviewCount,
      purchases: product.purchases,
      category: product.category,
      brand: product.brand,
      size: product.size,
      color: product.color,
      material: product.material,
      tags: product.tags,
      store: {
        id: product.storeId._id,
        name: product.storeId.storeName,
        image: product.storeId.storeImage,
      },
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    }));

    return NextResponse.json(
      successResponse(
        "FETCH",
        {
          category: {
            id: category._id,
            name: category.name,
            description: category.description,
          },
          products: formattedProducts,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(totalCount / limit),
            totalCount,
            hasNextPage: page < Math.ceil(totalCount / limit),
            hasPrevPage: page > 1,
            limit,
          },
          filters: {
            sortBy,
            sortOrder,
          },
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
