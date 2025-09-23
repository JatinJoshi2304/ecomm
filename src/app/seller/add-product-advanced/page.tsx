'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ColorSelector from '@/components/ColorSelector';
import Image from 'next/image';

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
}

interface ProductVariant {
  id: string;
  size: string;
  color: string;
  price: string;
  stock: string;
  sku: string;
}

export default function AdvancedAddProductPage() {
  const router = useRouter();
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    basePrice: '',
    category: '',
    brand: '',
    material: '',
    tags: [] as string[],
    images: [] as string[],
  });

  // Variants state
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [currentVariant, setCurrentVariant] = useState<ProductVariant>({
    id: '',
    size: '',
    color: '',
    price: '',
    stock: '',
    sku: ''
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
  const [showVariantForm, setShowVariantForm] = useState(false);

  // Hardcoded tokens for testing
  const SELLER_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY0ZjFhMmIzYzRkNWU2ZjdnOGg5aTBqMiIsInJvbGUiOiJzZWxsZXIiLCJpYXQiOjE3MzQ0Mjg4MDB9.example_seller_token";
  const ADMIN_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY0ZjFhMmIzYzRkNWU2ZjdnOGg5aTBqMSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTczNDQyODgwMH0.example_admin_token";

  useEffect(() => {
    loadOptions();
    loadStores();
  }, []);

  const loadOptions = async () => {
    try {
      // Load categories
      const categoriesResponse = await fetch('/api/customer/products/categories', {
        headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
      });
      if (categoriesResponse.ok) {
        const categoriesData = await categoriesResponse.json();
        if (categoriesData.success) {
          setCategories(categoriesData.data.categories);
        }
      }

      // Load brands
      const brandsResponse = await fetch('/api/customer/products/brands', {
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
      const response = await fetch('/api/seller/store', {
        headers: { 'Authorization': `Bearer ${SELLER_TOKEN}` }
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data.stores.length > 0) {
          setStores(result.data.stores);
          setSelectedStore(result.data.stores[0].id);
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

  const handleVariantInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCurrentVariant(prev => ({
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

  const addVariant = () => {
    if (!currentVariant.size || !currentVariant.color || !currentVariant.price || !currentVariant.stock) {
      setError('Please fill in all variant fields');
      return;
    }

    const variantId = `${currentVariant.size}-${currentVariant.color}`;
    const existingVariant = variants.find(v => v.id === variantId);
    
    if (existingVariant) {
      setError('This size-color combination already exists');
      return;
    }

    const newVariant = {
      ...currentVariant,
      id: variantId,
      sku: currentVariant.sku || `${formData.name.substring(0, 3).toUpperCase()}-${currentVariant.size}-${currentVariant.color}`
    };

    setVariants(prev => [...prev, newVariant]);
    setCurrentVariant({
      id: '',
      size: '',
      color: '',
      price: '',
      stock: '',
      sku: ''
    });
    setShowVariantForm(false);
    setError('');
  };

  const removeVariant = (variantId: string) => {
    setVariants(prev => prev.filter(v => v.id !== variantId));
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
      if (variants.length === 0) {
        setError('Please add at least one product variant');
        setLoading(false);
        return;
      }

      // Convert images to base64
      const imageBase64s = await Promise.all(
        imageFiles.map(file => convertToBase64(file))
      );

      // Create products for each variant
      const productPromises = variants.map(async (variant) => {
        const productData = {
          name: `${formData.name} - ${sizes.find(s => s.id === variant.size)?.name} - ${colors.find(c => c.id === variant.color)?.name}`,
          description: formData.description,
          price: parseFloat(variant.price),
          stock: parseInt(variant.stock),
          category: formData.category,
          brand: formData.brand,
          size: variant.size,
          color: variant.color,
          material: formData.material || undefined,
          tags: formData.tags,
          images: imageBase64s,
          storeId: selectedStore,
          sku: variant.sku
        };

        const response = await fetch('/api/seller/products', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SELLER_TOKEN}`
          },
          body: JSON.stringify(productData)
        });

        return response;
      });

      const responses = await Promise.all(productPromises);
      const allSuccessful = responses.every(response => response.ok);

      if (allSuccessful) {
        setSuccess(`Successfully added ${variants.length} product variants!`);
        setFormData({
          name: '',
          description: '',
          basePrice: '',
          category: '',
          brand: '',
          material: '',
          tags: [],
          images: [],
        });
        setVariants([]);
        setImageFiles([]);
        setImagePreviews([]);
      } else {
        setError('Some variants failed to add. Please try again.');
      }
    } catch (error) {
      console.error('Failed to add products:', error);
      setError('Failed to add products');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Add Product with Variants</h1>
            <p className="text-gray-600">Create a product with multiple size and color variants</p>
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

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <div className="border-b border-gray-200 pb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Basic Information</h2>
              
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
                    Base Price *
                  </label>
                  <input
                    type="number"
                    name="basePrice"
                    value={formData.basePrice}
                    onChange={handleInputChange}
                    required
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="mt-6">
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
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

              <div className="mt-6">
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
              <div className="mt-6">
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
            </div>

            {/* Product Variants */}
            <div className="border-b border-gray-200 pb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Product Variants</h2>
                <button
                  type="button"
                  onClick={() => setShowVariantForm(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Variant
                </button>
              </div>

              {/* Variant Form */}
              {showVariantForm && (
                <div className="bg-gray-50 p-6 rounded-lg mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Variant</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Size *
                      </label>
                      <select
                        name="size"
                        value={currentVariant.size}
                        onChange={handleVariantInputChange}
                        required
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
                        Price *
                      </label>
                      <input
                        type="number"
                        name="price"
                        value={currentVariant.price}
                        onChange={handleVariantInputChange}
                        required
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Stock *
                      </label>
                      <input
                        type="number"
                        name="stock"
                        value={currentVariant.stock}
                        onChange={handleVariantInputChange}
                        required
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        SKU
                      </label>
                      <input
                        type="text"
                        name="sku"
                        value={currentVariant.sku}
                        onChange={handleVariantInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Auto-generated"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <ColorSelector
                      colors={colors}
                      selectedColor={currentVariant.color}
                      onColorChange={(colorId) => setCurrentVariant(prev => ({ ...prev, color: colorId }))}
                      label="Color *"
                      required
                    />
                  </div>

                  <div className="flex justify-end space-x-4 mt-6">
                    <button
                      type="button"
                      onClick={() => {
                        setShowVariantForm(false);
                        setCurrentVariant({
                          id: '',
                          size: '',
                          color: '',
                          price: '',
                          stock: '',
                          sku: ''
                        });
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={addVariant}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Add Variant
                    </button>
                  </div>
                </div>
              )}

              {/* Variants List */}
              {variants.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">Added Variants ({variants.length})</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {variants.map((variant) => (
                      <div key={variant.id} className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900">
                            {sizes.find(s => s.id === variant.size)?.name} - {colors.find(c => c.id === variant.color)?.name}
                          </h4>
                          <button
                            type="button"
                            onClick={() => removeVariant(variant.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                        <div className="space-y-1 text-sm text-gray-600">
                          <p>Price: ${parseFloat(variant.price).toFixed(2)}</p>
                          <p>Stock: {variant.stock}</p>
                          <p>SKU: {variant.sku}</p>
                        </div>
                        <div className="mt-2">
                          <div
                            className="w-6 h-6 rounded-full border border-gray-300 inline-block"
                            style={{ backgroundColor: colors.find(c => c.id === variant.color)?.hexCode }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Images */}
            <div className="border-b border-gray-200 pb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Product Images</h2>
              
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
                        <Image
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          fill
                          className="w-full h-32 object-cover rounded-lg border"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
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
                disabled={loading || variants.length === 0}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Adding Products...
                  </div>
                ) : (
                  `Add ${variants.length} Product Variants`
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
