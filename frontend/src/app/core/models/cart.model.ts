export interface CartItem {
  id: string;
  userId: string;
  productId: string;
  quantity: number;
  addedAt: Date;
  product?: any; // We'll fix this type later
  user?: any; // We'll fix this type later
}