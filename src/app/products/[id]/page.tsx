'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { addToCart } from '@/store/slices/cartSlice';

interface Product {
  id?: string;
  _id?: string;
  name: string;
  description: string;
  price: number;
  stock: number;
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
  size: {
    id: string;
    name: string;
    type: string;
  }[];
  color: {
    id: string;
    name: string;
    hexCode: string;
  }[];
  material: {
    id: string;
    name: string;
  }[];
  tags: {
    _id: string;
    name: string;
  }[];
  store: {
    id: string;
    name: string;
    image: string;
    description: string;
  };
  // relatedProducts: Product[];
}

type RelatedProducts = Product[];

export default function ProductDetail() {
  const params = useParams();
  const productId = params.id as string;
  
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProduct, setRelatedProduct] = useState<RelatedProducts | null>(null);
  const [loading, setLoading] = useState(true);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [error, setError] = useState<string>('');
  const { sessionId } = useAppSelector((state) => state.cart);
  const dispatch = useAppDispatch();

  const loadProduct = useCallback(async () => {
    if (!productId) return;
    
    try {
      setLoading(true);
      setError('');
      const response = await fetch(`/api/customer/products/${productId}`);
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setProduct(result.data.product);
        } else {
          setError('Product not found');
        }
      } else {
        setError('Failed to load product');
      }
    } catch (error) {
      console.error('Failed to load product:', error);
      setError('Failed to load product');
    } finally {
      setLoading(false);
    }
  }, [productId]);

  const loadRelatedProduct = useCallback(async (tags: string[]) => {
    if (!tags || tags.length === 0) return;
    
    try {
      setRelatedLoading(true);
  
      // Join multiple tags as query params
      const query = tags.map(tag => `tags=${encodeURIComponent(tag)}`).join("&");
  
      const response = await fetch(`/api/customer/products/related?${query}`);
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setRelatedProduct(result.data.products);
        }
      }
    } catch (error) {
      console.error('Failed to load related products:', error);
    } finally {
      setRelatedLoading(false);
    }
  }, []);
  

  useEffect(() => {
    loadProduct();
  }, [loadProduct]);

  useEffect(() => {
    if (product && product.tags && product.tags.length > 0 && !relatedProduct && !relatedLoading) {
      const tagNames = product.tags.map(tag => tag._id);
      loadRelatedProduct(tagNames);
    }
  }, [product, relatedProduct, relatedLoading, loadRelatedProduct]);

  

  const handleAddToCart = async () => {
    if (!product) return;

    try {
      setIsAddingToCart(true);
      setError('');
       
      // const response = await fetch('/api/customer/cart', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     ...(token && { 'Authorization': `Bearer ${token}` })
      //   },
      //   body: JSON.stringify({
      //     productId: product._id,
      //     quantity,
      //     size: selectedSize || null,
      //     color: selectedColor || null,
      //     ...(token ? {} : { sessionId })
      //   })
      // });

      await dispatch(addToCart({
        productId: product.id || '',
        quantity: quantity,
        size: selectedSize || undefined,
        color: selectedColor || undefined,
        sessionId: sessionId || undefined,
      }));
    } catch (error) {
      console.error('Failed to add product to cart:', error);
      setError('Failed to add product to cart');
    } finally {
      setIsAddingToCart(false);
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
          <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
        </svg>
      );
    }

    if (hasHalfStar) {
      stars.push(
        <svg key="half" className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
          <defs>
            <linearGradient id="half-fill">
              <stop offset="50%" stopColor="currentColor" />
              <stop offset="50%" stopColor="transparent" />
            </linearGradient>
          </defs>
          <path fill="url(#half-fill)" d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
        </svg>
      );
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <svg key={`empty-${i}`} className="w-5 h-5 text-gray-300 fill-current" viewBox="0 0 20 20">
          <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
        </svg>
      );
    }

    return stars;
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

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <Link
              href="/"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Home
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
        {/* Breadcrumb */}
        <nav className="flex mb-8" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li className="inline-flex items-center">
              <Link href="/" className="text-gray-700 hover:text-blue-600">
                Home
              </Link>
            </li>
            <li>
              <div className="flex items-center">
                <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                <Link href={`/categories/${product.category.id}`} className="ml-1 text-gray-700 hover:text-blue-600 md:ml-2">
                  {product.category.name}
                </Link>
              </div>
            </li>
            <li aria-current="page">
              <div className="flex items-center">
                <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                <span className="ml-1 text-gray-500 md:ml-2">{product.name}</span>
              </div>
            </li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div>
            <div className="aspect-square mb-4">
              {product.images && product.images.length > 0 ? (
                <Image
                  src={product.images[selectedImage]}
                  alt={product.name}
                  width={600}
                  height={600}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
                  <svg className="w-24 h-24 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </div>
            
            {/* Thumbnail Images */}
            {product.images && product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 ${
                      selectedImage === index ? 'border-blue-600' : 'border-gray-200'
                    }`}
                  >
                    <Image
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      width={150}
                      height={150}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>
            
            {/* Rating */}
            <div className="flex items-center mb-4">
              <div className="flex items-center">
                {renderStars(product.averageRating)}
              </div>
              <span className="text-sm text-gray-500 ml-2">
                {product.averageRating.toFixed(1)} ({product.reviewCount} reviews)
              </span>
            </div>

            {/* Price */}
            <div className="text-3xl font-bold text-gray-900 mb-6">
              ${product.price.toFixed(2)}
            </div>

            {/* Description */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-gray-600">{product.description}</p>
            </div>

            {/* Size Selection */}
            {product.size && product.size.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Size</h3>
                <div className="flex flex-wrap gap-2">
                  {product.size.map((size) => (
                    <button
                      key={size.id}
                      onClick={() => setSelectedSize(size.id)}
                      className={`px-4 py-2 border rounded-lg ${
                        selectedSize === size.id
                          ? 'border-blue-600 bg-blue-50 text-blue-600'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {size.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Color Selection */}
            {product.color && product.color.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Color</h3>
                <div className="flex flex-wrap gap-2">
                  {product.color.map((color) => (
                    <button
                      key={color.id}
                      onClick={() => setSelectedColor(color.id)}
                      className={`w-10 h-10 rounded-full border-2 ${
                        selectedColor === color.id
                          ? 'border-blue-600'
                          : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color.hexCode }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Quantity</h3>
              <div className="flex items-center">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 border text-black border-gray-300 rounded-l-lg flex items-center justify-center hover:bg-gray-50"
                >
                  -
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-16 h-10 text-black border-t border-b border-gray-300 text-center"
                  min="1"
                  max={product.stock}
                />
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="w-10 h-10 border text-black border-gray-300 rounded-r-lg flex items-center justify-center hover:bg-gray-50"
                >
                  +
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {product.stock} items available
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}

            {/* Add to Cart Button */}
            <button
              onClick={handleAddToCart}
              disabled={isAddingToCart || product.stock === 0}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isAddingToCart ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Adding to Cart...
                </div>
              ) : product.stock === 0 ? (
                'Out of Stock'
              ) : (
                'Add to Cart'
              )}
            </button>

            {/* Product Details */}
            <div className="mt-8 space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Brand:</span>
                <span className="font-medium text-gray-600">{product.brand.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Category:</span>
                <span className="font-medium text-gray-600">{product.category.name}</span>
              </div>
              {product.material && product.material.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Material:</span>
                  <span className="font-medium">{product.material.map(m => m.name).join(', ')}</span>
                </div>
              )}
              {product.tags && product.tags.length > 0 && (
                <div>
                  <span className="text-gray-600">Tags:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {product.tags.map((tag) => (
                      <span key={tag._id} className="px-2 py-1 bg-gray-200 text-gray-700 text-sm rounded">
                        {tag.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Store Info */}
            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Sold by</h3>
              <div className="flex items-center">
                {product.store.image && (
                  <Image
                    src={product.store.image}
                    alt={product.store.name}
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-full object-cover mr-3"
                  />
                )}
                <div>
                  <div
                    // href={`/stores/${product.store.id}`}
                    className="font-medium text-blue-600 hover:text-blue-700"
                  >
                    {product.store.name}
                  </div>
                  <p className="text-sm text-gray-600">{product.store.description}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {(relatedProduct && relatedProduct.length > 0) || relatedLoading ? (
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Related Products</h2>
            {relatedLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Loading related products...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {relatedProduct?.map((relatedProduct) => (
                  <Link
                    key={relatedProduct._id}
                    href={`/products/${relatedProduct.id}`}
                    className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden"
                  >
                    <div className="aspect-square relative">
                      {relatedProduct.images && relatedProduct.images.length > 0 ? (
                        <Image
                          src={relatedProduct.images[0]}
                          alt={relatedProduct.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                        {relatedProduct.name}
                      </h3>
                      <p className="text-lg font-bold text-gray-900">
                        ${relatedProduct.price.toFixed(2)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </div>

      <Footer />
    </div>
  );
}
