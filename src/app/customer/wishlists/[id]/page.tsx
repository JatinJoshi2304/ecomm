"use client";
import React, { use } from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAppSelector } from "@/store/hooks";
import Image from "next/image";

interface Wishlist {
  _id: string;
  name: string;
  description?: string;
  isDefault: boolean;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

interface WishlistItem {
  _id: string;
  productId: {
    _id: string;
    name: string;
    price: number;
    images: string[];
    stock: number;
    isActive: boolean;
    category: { name: string };
    brand: { name: string };
  };
  size?: { name: string };
  color?: { name: string; hexCode: string };
  notes?: string;
  priority: "low" | "medium" | "high";
  createdAt: string;
}

// interface CustomerWishlistPageProps {
//   params: {
//     id: string;
//   };
// }

export default function CustomerWishlistPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { isAuthenticated, token } = useAppSelector((state) => state.auth);
  const { id }: any = use(params);
  const [wishlist, setWishlist] = useState<Wishlist | null>(null);
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPublic, setEditPublic] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    loadWishlist();
  }, [isAuthenticated, router, id]);

  const loadWishlist = async () => {
    try {
      const response = await fetch(`/api/customer/wishlists/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setWishlist(result.data.wishlist);
          setItems(result.data.items);
          setEditName(result.data.wishlist.name);
          setEditDescription(result.data.wishlist.description || "");
          setEditPublic(result.data.wishlist.isPublic);
        }
      }
    } catch (error) {
      console.error("Failed to load wishlist:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateWishlist = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editName.trim()) return;

    try {
      const response = await fetch(`/api/customer/wishlists/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editName.trim(),
          description: editDescription.trim(),
          isPublic: editPublic,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setWishlist(result.data);
          setShowEditForm(false);
        }
      }
    } catch (error) {
      console.error("Failed to update wishlist:", error);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    if (
      !confirm("Are you sure you want to remove this item from your wishlist?")
    )
      return;

    try {
      const response = await fetch(
        `/api/customer/wishlists/${id}/items/${itemId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        setItems(items.filter((item) => item._id !== itemId));
      }
    } catch (error) {
      console.error("Failed to remove item:", error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!wishlist) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Wishlist not found
            </h3>
            <Link
              href="/customer/wishlists"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Wishlists
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {wishlist.name}
              </h1>
              {wishlist.description && (
                <p className="text-gray-600 mt-2">{wishlist.description}</p>
              )}
              <div className="flex gap-2 mt-2">
                {wishlist.isDefault && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    Default
                  </span>
                )}
                {wishlist.isPublic && (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                    Public
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowEditForm(true)}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Edit Wishlist
              </button>
              <Link
                href="/customer/wishlists"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Back to Wishlists
              </Link>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        {showEditForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Edit Wishlist
            </h3>
            <form onSubmit={handleUpdateWishlist}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                    disabled={wishlist.isDefault}
                  />
                  {wishlist.isDefault && (
                    <p className="text-xs text-gray-500 mt-1">
                      Cannot rename default wishlist
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Public
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editPublic}
                      onChange={(e) => setEditPublic(e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-600">
                      Make this wishlist public
                    </span>
                  </label>
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Update Wishlist
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditForm(false)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Items */}
        {items.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 text-gray-400">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No items in this wishlist
            </h3>
            <p className="text-gray-600 mb-6">
              Start adding products to your wishlist
            </p>
            <Link
              href="/"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <div
                key={item._id}
                className="bg-white rounded-lg shadow-md overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {item.productId.name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {item.productId.brand.name} •{" "}
                        {item.productId.category.name}
                      </p>
                      <p className="text-lg font-bold text-gray-900">
                        ₹{item.productId.price.toFixed(2)}
                      </p>
                    </div>
                    {/* <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(item.priority)}`}>
                      {item.priority}
                    </span> */}
                  </div>

                  {/* Product Image */}
                  <div className="mb-4">
                    {item.productId.images[0] ? (
                      <Image
                        src={item.productId.images[0]}
                        alt={item.productId.name}
                        width={200}
                        height={200}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gray-200 flex items-center justify-center rounded-lg">
                        <svg
                          className="w-12 h-12 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Item Details */}
                  <div className="mb-4">
                    {item.size && (
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">Size:</span>{" "}
                        {item.size.name}
                      </p>
                    )}
                    {item.color && (
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">Color:</span>{" "}
                        {item.color.name}
                      </p>
                    )}
                    {item.notes && (
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">Notes:</span> {item.notes}
                      </p>
                    )}
                  </div>

                  {/* Stock Status */}
                  <div className="mb-4">
                    {item.productId.stock > 0 ? (
                      <span className="text-sm text-green-600 font-medium">
                        In Stock ({item.productId.stock} available)
                      </span>
                    ) : (
                      <span className="text-sm text-red-600 font-medium">
                        Out of Stock
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Link
                      href={`/products/${item.productId._id}`}
                      className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-center text-sm font-medium"
                    >
                      View Product
                    </Link>
                    <button
                      onClick={() => handleRemoveItem(item._id)}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
