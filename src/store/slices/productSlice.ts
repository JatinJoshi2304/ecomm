import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

// Types
export interface Product {
  id?: string;
  _id?: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  images: string[];
  averageRating: number;
  category: {
    _id: string;
    name: string;
  };
  brand: {
    _id: string;
    name: string;
  };
  size?: {
    _id: string;
    name: string;
    type: string;
  };
  color?: {
    _id: string;
    name: string;
    hexCode: string;
  };
  material?: {
    _id: string;
    name: string;
  };
  tags: Array<{
    _id: string;
    name: string;
  }>;
  storeId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
}

export interface Brand {
  _id: string;
  name: string;
  description?: string;
  isActive: boolean;
}

export interface ProductState {
  products: Product[];
  featuredProducts: Product[];
  recentProducts: Product[];
  categories: Category[];
  brands: Brand[];
  currentProduct: Product | null;
  searchResults: Product[];
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SearchParams {
  query?: string;
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Initial state
const initialState: ProductState = {
  products: [],
  featuredProducts: [],
  recentProducts: [],
  categories: [],
  brands: [],
  currentProduct: null,
  searchResults: [],
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  },
};

// Async thunks
export const fetchFeaturedProducts = createAsyncThunk(
  'product/fetchFeaturedProducts',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/customer/products/featured');
      const data = await response.json();
console.log("Featured products data ::::", data);
      if (!response.ok) {
        return rejectWithValue(data.message || 'Failed to fetch featured products');
      }

      return data.data.products.bestSelling;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Network error');
    }
  }
);

export const fetchRecentProducts = createAsyncThunk(
  'product/fetchRecentProducts',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/customer/products');
      const data = await response.json();
console.log("Recent Products ::::", data);
      if (!response.ok) {
        return rejectWithValue(data.message || 'Failed to fetch featured products');
      }

      return data.data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Network error');
    }
  }
);

export const fetchCategories = createAsyncThunk(
  'product/fetchCategories',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/customer/products/categories');
      const data = await response.json();
      console.log("Category data ::::", data);

      if (!response.ok) {
        return rejectWithValue(data.message || 'Failed to fetch categories');
      }

      return data.data.categories;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Network error');
    }
  }
);

export const fetchBrands = createAsyncThunk(
  'product/fetchBrands',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/customer/products/brands');
      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Failed to fetch brands');
      }

      return data.data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Network error');
    }
  }
);

export const fetchProductById = createAsyncThunk(
  'product/fetchProductById',
  async (productId: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/customer/products/${productId}`);
      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Failed to fetch product');
      }

      return data.data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Network error');
    }
  }
);

export const searchProducts = createAsyncThunk(
  'product/searchProducts',
  async (params: SearchParams, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.query) queryParams.append('query', params.query);
      if (params.category) queryParams.append('category', params.category);
      if (params.brand) queryParams.append('brand', params.brand);
      if (params.minPrice) queryParams.append('minPrice', params.minPrice.toString());
      if (params.maxPrice) queryParams.append('maxPrice', params.maxPrice.toString());
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

      const response = await fetch(`/api/customer/products/search?${queryParams}`);
      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Failed to search products');
      }

      return {
        products: data.data.products,
        pagination: data.data.pagination,
      };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Network error');
    }
  }
);

export const fetchProductsByCategory = createAsyncThunk(
  'product/fetchProductsByCategory',
  async (params: { categoryId: string; page?: number; limit?: number }, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());

      const response = await fetch(`/api/customer/products/category/${params.categoryId}?${queryParams}`);
      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Failed to fetch products by category');
      }

      return {
        products: data.data.products,
        pagination: data.data.pagination,
      };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Network error');
    }
  }
);

// Product slice
const productSlice = createSlice({
  name: 'product',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentProduct: (state) => {
      state.currentProduct = null;
    },
    clearSearchResults: (state) => {
      state.searchResults = [];
    },
    setPagination: (state, action: PayloadAction<{ page: number; limit: number; total: number; totalPages: number }>) => {
      state.pagination = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Fetch featured products
    builder
      .addCase(fetchFeaturedProducts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchFeaturedProducts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.featuredProducts = action.payload;
        state.error = null;
      })
      .addCase(fetchFeaturedProducts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

      builder
      .addCase(fetchRecentProducts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchRecentProducts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.recentProducts = action.payload;
        state.error = null;
      })
      .addCase(fetchRecentProducts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
    // Fetch categories
    builder
      .addCase(fetchCategories.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.isLoading = false;
        state.categories = action.payload;
        state.error = null;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch brands
    builder
      .addCase(fetchBrands.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchBrands.fulfilled, (state, action) => {
        state.isLoading = false;
        state.brands = action.payload;
        state.error = null;
      })
      .addCase(fetchBrands.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch product by ID
    builder
      .addCase(fetchProductById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProductById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentProduct = action.payload;
        state.error = null;
      })
      .addCase(fetchProductById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Search products
    builder
      .addCase(searchProducts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(searchProducts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.searchResults = action.payload.products;
        state.pagination = action.payload.pagination;
        state.error = null;
      })
      .addCase(searchProducts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch products by category
    builder
      .addCase(fetchProductsByCategory.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProductsByCategory.fulfilled, (state, action) => {
        state.isLoading = false;
        state.products = action.payload.products;
        state.pagination = action.payload.pagination;
        state.error = null;
      })
      .addCase(fetchProductsByCategory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearCurrentProduct, clearSearchResults, setPagination } = productSlice.actions;
export default productSlice.reducer;
