export interface Notification {
  id: string;
  userId?: string;
  storeId?: string;
  message: string;
  type: 'LOW_STOCK' | 'EXPIRY' | 'ORDER' | 'SYSTEM';
  isRead: boolean;
  createdAt: Date;
  user?: any; // We'll fix this type later
  store?: any; // We'll fix this type later
}