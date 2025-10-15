'use client';

import { useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchFeaturedProducts, fetchRecentProducts } from '@/store/slices/productSlice';


export default function Home() {
  const dispatch = useAppDispatch();
  const { featuredProducts,recentProducts, isLoading } = useAppSelector((state) => state.product);

  useEffect(() => {
    // Load featured products and categories
    dispatch(fetchFeaturedProducts());
    dispatch(fetchRecentProducts());
    // dispatch(fetchCategories());
  }, [dispatch]);

  if (isLoading) {
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Welcome to Our Store
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
              Discover amazing products from trusted sellers. Shop with confidence and enjoy fast delivery.
            </p>
            {/* <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                // href="/categories"
                href="#"
                className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Browse Categories
              </Link>
              <Link
                href="#"
                // href="/search"
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
              >
                Search Products
              </Link>
            </div> */}
          </div>
        </div>
      </section>

       {/* Categories Section */}
 {/* <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Shop by Category</h2>
            <p className="text-lg text-gray-600">Find exactly what you&apos;re looking for</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {categories.slice(0, 6).map((category) => (
              <Link
                key={category.id}
                href={`/categories/${category.id}`}
                className="bg-white rounded-lg p-6 text-center hover:shadow-lg transition-shadow group"
              >
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{category.name}</h3>
                <p className="text-sm text-gray-500">Browse products</p>
              </Link>
            ))}
          </div>
        </div>
      </section> */}

      {/* Best Selling Products */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Best Sellers</h2>
              <p className="text-lg text-gray-600">Most popular products</p>
            </div>
            {/* <Link
              href="/search?sortBy=purchases&sortOrder=desc"
              className="text-blue-600 hover:text-blue-700 font-semibold"
            >
              View All →
            </Link> */}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.slice(0, 8).map((product) => (
              <ProductCard
                key={product.id}
                product={{
                  id: product.id || "",
                  name: product.name,
                  description: product.description,
                  price: product.price,
                  stock: product.stock,
                  images: product.images,
                  averageRating: product.averageRating || 4.5, // Default rating
                  reviewCount: 0, // Default review count
                  category: {
                    id: product.category._id,
                    name: product.category.name,
                  },
                  brand: {
                    id: product.brand._id,
                    name: product.brand.name,
                  },
                  store: {
                    id: product.storeId,
                    name: 'Store',
                    image: '',
                  },
                }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Recent Products */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Recently Launch Products</h2>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {recentProducts.map((product) => (
              <ProductCard
                key={product._id}
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
                    id: product.category._id,
                    name: product.category.name,
                  },
                  brand: {
                    id: product.brand._id,
                    name: product.brand.name,
                  },
                  store: {
                    id: product.storeId,
                    name: 'Store',
                    image: '',
                  },
                }}
              />
            ))}
          </div>
        </div>
      </section>



      <Footer />
    </div>
  );
}