export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  reorderLevel?: number;
  expiryDate?: Date;
  imageUrl?: string;
  category: string;
  storeId: string;
  createdAt: Date;
  lowStockThreshold: number;
  store?: any; // We'll fix this type later
}

export interface ProductFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  page?: number;
  limit?: number;
}