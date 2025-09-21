import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/config/db";
import Product from "@/models/product.model";
import { successResponse, errorResponse } from "@/lib/response";
import { RESPONSE_MESSAGES } from "@/constants/responseMessages";

// GET /api/customer/products/search - Search products with filters
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const url = new URL(req.url);
    const searchParams = url.searchParams;

    // Extract search parameters
    const query = searchParams.get("q") || "";
    const category = searchParams.get("category");
    const brand = searchParams.get("brand");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const minRating = searchParams.get("minRating");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const skip = (page - 1) * limit;

    // Build search query
    const searchQuery: any = {
      isActive: true, // Only show active products
    };

    // Text search
    if (query) {
      searchQuery.$or = [
        { name: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
      ];
    }

    // Category filter
    if (category) {
      searchQuery.category = category;
    }

    // Brand filter
    if (brand) {
      searchQuery.brand = brand;
    }

    // Price range filter
    if (minPrice || maxPrice) {
      searchQuery.price = {};
      if (minPrice) searchQuery.price.$gte = parseFloat(minPrice);
      if (maxPrice) searchQuery.price.$lte = parseFloat(maxPrice);
    }

    // Rating filter
    if (minRating) {
      searchQuery.averageRating = { $gte: parseFloat(minRating) };
    }

    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    // Execute search with pagination
    const products = await Product.find(searchQuery)
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

    // Get total count for pagination
    const totalCount = await Product.countDocuments(searchQuery);

    // Format response
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
            query,
            category,
            brand,
            minPrice: minPrice ? parseFloat(minPrice) : null,
            maxPrice: maxPrice ? parseFloat(maxPrice) : null,
            minRating: minRating ? parseFloat(minRating) : null,
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
