import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/config/db";
import Product from "@/models/product.model";
import { successResponse, errorResponse } from "@/lib/response";
import { RESPONSE_MESSAGES } from "@/constants/responseMessages";
import "@/models/index";
// GET /api/customer/products/featured - Get featured products
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const url = new URL(req.url);
    const type = url.searchParams.get("type") || "all"; // all, topRated, bestSelling, newArrivals
    const limit = parseInt(url.searchParams.get("limit") || "8");

    const baseQuery = { isActive: true };
    const populateFields = [
      "category", "brand", "size", "color", "material", "tags", "storeId"
    ];

    let products:any;

    if (type === "all") {
      // Get all types of featured products
      const [topRated, bestSelling, newArrivals] = await Promise.all([
        // Top Rated Products
        Product.find({ ...baseQuery, averageRating: { $gte: 4.0 } })
          .populate(populateFields)
          .sort({ averageRating: -1, reviewCount: -1 })
          .limit(limit),

        // Best Selling Products
        Product.find(baseQuery)
          .populate(populateFields)
          .sort({ purchases: -1 })
          .limit(limit),

        // New Arrivals
        Product.find(baseQuery)
          .populate(populateFields)
          .sort({ createdAt: -1 })
          .limit(limit),
      ]);

      products = {
        topRated: formatProducts(topRated),
        bestSelling: formatProducts(bestSelling),
        newArrivals: formatProducts(newArrivals),
      };
    } else {
      // Get specific type
      const query = baseQuery;
      let sort: any = {};

      switch (type) {
        case "bestSelling":
          sort = { purchases: -1 };
          break;
        case "newArrivals":
          sort = { createdAt: -1 };
          break;
        default:
          sort = { createdAt: -1 };
      }

      const result = await Product.find(query)
        .populate(populateFields)
        .sort(sort)
        .limit(limit);

      products = formatProducts(result);
    }

    return NextResponse.json(
      successResponse(
        "FETCH",
        {
          type,
          products,
          count: Array.isArray(products) ? products.length : Object.keys(products).length,
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

// Helper function to format products
function formatProducts(products: any[]) {
  return products.map(product => ({
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
}
