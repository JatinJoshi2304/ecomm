'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import Link from 'next/link';

interface Product {
  id?: string;
  _id?: string;
  name: string;
  description: string;
  price: number;
  stock:number;
  images: string[];
  averageRating: number;
  reviewCount: number;
  category: {
    id: string;
    name: string;
  };
  brand: {
    id: string;
    name: string;
  };
  store?: {
    id: string;
    name: string;
    image: string;
  };
}

interface SearchFilters {
  query: string;
  category: string;
  brand: string;
  minPrice: string;
  maxPrice: string;
  sortBy: string;
  sortOrder: string;
  page: number;
  limit: number;
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const currentPage = 1;
  const totalPages = 1;
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  
  const [filters, setFilters] = useState<SearchFilters>({
    query: searchParams.get('q') || '',
    category: searchParams.get('category') || '',
    brand: searchParams.get('brand') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    sortBy: searchParams.get('sortBy') || 'createdAt',
    sortOrder: searchParams.get('sortOrder') || 'desc',
    page: 1,
    limit: 12
  });
  console.log("Products :::::",products);

  useEffect(() => {
    loadCategories();
    loadBrands();
    console.log(categories);
    console.log(brands);
  }, []);

  useEffect(() => {
    searchProducts();
  }, [filters]);

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/customer/products/categories');
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setCategories(result.data.categories);
        }
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const loadBrands = async () => {
    try {
      const response = await fetch('/api/customer/products/brands');
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setBrands(result.data.brands);
        }
      }
    } catch (error) {
      console.error('Failed to load brands:', error);
    }
  };

  const searchProducts = async () => {
    try {
      setLoading(true);
      
      const queryParams = new URLSearchParams();
      if (filters.query) queryParams.append('q', filters.query);

      console.log("queryParams ::::::::",queryParams.toString())
      const response = await fetch(`/api/customer/products/search?${queryParams.toString()}`);
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setProducts(result.data);
        }
      }
    } catch (error) {
      console.error('Failed to search products:', error);
    } finally {
      setLoading(false);
    }
  };

  // const handleFilterChange = (key: keyof SearchFilters, value: string | number) => {
  //   setFilters(prev => ({
  //     ...prev,
  //     [key]: value,
  //     page: 1 // Reset to first page when filters change
  //   }));
  // };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({
      ...prev,
      page
    }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    setFilters(prev => ({
      ...prev,
      query: searchParams.get('q') || '',
      category: searchParams.get('category') || '',
      brand: searchParams.get('brand') || '',
      minPrice: searchParams.get('minPrice') || '',
      maxPrice: searchParams.get('maxPrice') || '',
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: searchParams.get('sortOrder') || 'desc',
      page: Number(searchParams.get('page')) || 1,
      limit: Number(searchParams.get('limit')) || 12,
    }));
  }, [searchParams]);

  const handleAddToCart = async (productId: string) => {
    try {
      const sessionId = localStorage.getItem('sessionId') || generateSessionId();
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/customer/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          productId,
          quantity: 1,
          ...(token ? {} : { sessionId })
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          console.log('Product added to cart successfully');
        }
      }
    } catch (error) {
      console.error('Failed to add product to cart:', error);
    }
  };


  const generateSessionId = () => {
    const sessionId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('sessionId', sessionId);
    return sessionId;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Products Grid */}
          <div className="flex-1">
            {/* Results Header */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {filters.query ? `Search results for "${filters.query}"` : 'All Products'}
              </h1>
              <p className="text-gray-600">
                {loading ? 'Loading...' : `${products.length} products found`}
              </p>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            )}

            {/* Products Grid */}
            {!loading && products.length > 0 && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {products.map((product,index) => (
                    <ProductCard
                      key={index}
                      showAddCart={false}
                      product={{
                        id: product._id || "",
                        name: product.name,
                        description: product.description,
                        price: product.price,
                        stock: product.stock,
                        images: product.images,
                        averageRating: 4.5, // Default rating
                        reviewCount: 0, // Default review count
                        category: {
                          id: product.category.id,
                          name: product.category.name,
                        },
                        brand: {
                          id: product.brand.id,
                          name: product.brand.name,
                        }
                      }}
                      onAddToCart={handleAddToCart}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center space-x-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-2 border rounded-lg ${
                          currentPage === page
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}

            {/* No Results */}
            {!loading && products.length === 0 && (
              <div className="text-center py-12">
                <svg className="mx-auto h-24 w-24 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <h2 className="text-2xl font-bold text-gray-900 mt-6 mb-4">No products found</h2>
                <p className="text-gray-600 mb-8">
                  Try adjusting your search criteria or browse our categories.
                </p>
                <Link
                  href="/"
                  className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Browse All Products
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
