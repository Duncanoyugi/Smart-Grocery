export interface StockHistory {
  id: string;
  productId: string;
  change: number;
  reason?: string;
  createdBy?: string;
  createdAt: Date;
  product?: any; // We'll fix this type later
}