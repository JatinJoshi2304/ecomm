'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface Category {
  id: string;
  name: string;
}

interface Brand {
  id: string;
  name: string;
}

interface Size {
  id: string;
  name: string;
  type: string;
}

interface Color {
  id: string;
  name: string;
  hexCode: string;
}

interface Material {
  id: string;
  name: string;
}

interface Tag {
  id: string;
  name: string;
}

interface Store {
  id: string;
  name: string;
  userId: string;
}

export default function AdminAddProductPage() {
  const router = useRouter();
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category: '',
    brand: '',
    size: '',
    color: '',
    material: '',
    tags: [] as string[],
    images: [] as string[],
  });

  // Options data
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [sizes, setSizes] = useState<Size[]>([]);
  const [colors, setColors] = useState<Color[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [stores, setStores] = useState<Store[]>([]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedStore, setSelectedStore] = useState('');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  // Hardcoded admin token for testing
  const ADMIN_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY0ZjFhMmIzYzRkNWU2ZjdnOGg5aTBqMSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTczNDQyODgwMH0.example_admin_token";

  useEffect(() => {
    loadOptions();
    loadStores();
  }, []);

  const loadOptions = async () => {
    try {
      // Load categories
      const categoriesResponse = await fetch('/api/admin/categories', {
        headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
      });
      if (categoriesResponse.ok) {
        const categoriesData = await categoriesResponse.json();
        if (categoriesData.success) {
          setCategories(categoriesData.data.categories);
        }
      }

      // Load brands
      const brandsResponse = await fetch('/api/admin/brands', {
        headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
      });
      if (brandsResponse.ok) {
        const brandsData = await brandsResponse.json();
        if (brandsData.success) {
          setBrands(brandsData.data.brands);
        }
      }

      // Load sizes
      const sizesResponse = await fetch('/api/admin/sizes', {
        headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
      });
      if (sizesResponse.ok) {
        const sizesData = await sizesResponse.json();
        if (sizesData.success) {
          setSizes(sizesData.data.sizes);
        }
      }

      // Load colors
      const colorsResponse = await fetch('/api/admin/colors', {
        headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
      });
      if (colorsResponse.ok) {
        const colorsData = await colorsResponse.json();
        if (colorsData.success) {
          setColors(colorsData.data.colors);
        }
      }

      // Load materials
      const materialsResponse = await fetch('/api/admin/materials', {
        headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
      });
      if (materialsResponse.ok) {
        const materialsData = await materialsResponse.json();
        if (materialsData.success) {
          setMaterials(materialsData.data.materials);
        }
      }

      // Load tags
      const tagsResponse = await fetch('/api/admin/tags', {
        headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
      });
      if (tagsResponse.ok) {
        const tagsData = await tagsResponse.json();
        if (tagsData.success) {
          setTags(tagsData.data.tags);
        }
      }
    } catch (error) {
      console.error('Failed to load options:', error);
    }
  };

  const loadStores = async () => {
    try {
      // Admin can see all stores
      const response = await fetch('/api/admin/seller', {
        headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Get stores for approved sellers
          const approvedSellers = result.data.sellers.filter((seller: any) => seller.isApproved);
          const storePromises = approvedSellers.map(async (seller: any) => {
            try {
              const storeResponse = await fetch(`/api/seller/store?userId=${seller.id}`, {
                headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
              });
              if (storeResponse.ok) {
                const storeResult = await storeResponse.json();
                if (storeResult.success && storeResult.data.stores.length > 0) {
                  return storeResult.data.stores[0];
                }
              }
            } catch (error) {
              console.error(`Failed to load store for seller ${seller.id}:`, error);
            }
            return null;
          });
          
          const storeResults = await Promise.all(storePromises);
          const validStores = storeResults.filter(store => store !== null);
          setStores(validStores);
        }
      }
    } catch (error) {
      console.error('Failed to load stores:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTagToggle = (tagId: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tagId)
        ? prev.tags.filter(id => id !== tagId)
        : [...prev.tags, tagId]
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setImageFiles(files);
    
    const previews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(previews);
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Convert images to base64
      const imageBase64s = await Promise.all(
        imageFiles.map(file => convertToBase64(file))
      );

      const productData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        category: formData.category,
        brand: formData.brand,
        size: formData.size || undefined,
        color: formData.color || undefined,
        material: formData.material || undefined,
        tags: formData.tags,
        images: imageBase64s,
        storeId: selectedStore
      };

      // Admin can add products to any store
      const response = await fetch('/api/seller/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ADMIN_TOKEN}`
        },
        body: JSON.stringify(productData)
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setSuccess('Product added successfully!');
          setFormData({
            name: '',
            description: '',
            price: '',
            stock: '',
            category: '',
            brand: '',
            size: '',
            color: '',
            material: '',
            tags: [],
            images: [],
          });
          setImageFiles([]);
          setImagePreviews([]);
        } else {
          setError(result.message || 'Failed to add product');
        }
      } else {
        setError('Failed to add product');
      }
    } catch (error) {
      console.error('Failed to add product:', error);
      setError('Failed to add product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Add New Product (Admin)</h1>
            <p className="text-gray-600">Create a new product listing for any store</p>
          </div>

          {/* Success Message */}
          {success && (
            <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
              {success}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter product name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price *
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter product description"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stock Quantity *
                </label>
                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleInputChange}
                  required
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Store *
                </label>
                <select
                  value={selectedStore}
                  onChange={(e) => setSelectedStore(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Store</option>
                  {stores.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Category and Brand */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Brand *
                </label>
                <select
                  name="brand"
                  value={formData.brand}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Brand</option>
                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Size and Color */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Size
                </label>
                <select
                  name="size"
                  value={formData.size}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Size</option>
                  {sizes.map((size) => (
                    <option key={size.id} value={size.id}>
                      {size.name} ({size.type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color
                </label>
                <select
                  name="color"
                  value={formData.color}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Color</option>
                  {colors.map((color) => (
                    <option key={color.id} value={color.id}>
                      {color.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Material */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Material
              </label>
              <select
                name="material"
                value={formData.material}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Material</option>
                {materials.map((material) => (
                  <option key={material.id} value={material.id}>
                    {material.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {tags.map((tag) => (
                  <label key={tag.id} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.tags.includes(tag.id)}
                      onChange={() => handleTagToggle(tag.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{tag.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Images */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Images *
              </label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              
              {/* Image Previews */}
              {imagePreviews.length > 0 && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Adding Product...
                  </div>
                ) : (
                  'Add Product'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <Footer />
    </div>
  );
}
