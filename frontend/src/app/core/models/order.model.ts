export interface Order {
  id: string;
  userId: string;
  total: number;
  status: 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  createdAt: Date;
  user?: any; // We'll fix this type later
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  price: number;
  order?: any; // We'll fix this type later
  product?: any; // We'll fix this type later
}