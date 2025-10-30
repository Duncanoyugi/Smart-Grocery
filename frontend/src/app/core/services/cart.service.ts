import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CartItem } from '../models/cart.model';
import { ApiResponse } from '../models/api-response.model';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private apiUrl = `${environment.apiUrl}/cart`;
  private cartItemsSubject = new BehaviorSubject<CartItem[]>([]);
  public cartItems$ = this.cartItemsSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadCart();
  }

  // Get cart items
  getCart(): Observable<ApiResponse<CartItem[]>> {
    return this.http.get<ApiResponse<CartItem[]>>(this.apiUrl);
  }

  // Add item to cart
  addToCart(productId: string, quantity: number = 1): Observable<ApiResponse<CartItem>> {
    return this.http.post<ApiResponse<CartItem>>(this.apiUrl, {
      productId,
      quantity
    });
  }

  // Update cart item quantity
  updateCartItem(cartItemId: string, quantity: number): Observable<ApiResponse<CartItem>> {
    return this.http.patch<ApiResponse<CartItem>>(`${this.apiUrl}/${cartItemId}`, {
      quantity
    });
  }

  // Remove item from cart
  removeFromCart(cartItemId: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${cartItemId}`);
  }

  // Clear entire cart
  clearCart(): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(this.apiUrl);
  }

  // Get cart item count
  get cartItemCount(): number {
    return this.cartItemsSubject.value.reduce((total, item) => total + item.quantity, 0);
  }

  // Get cart total
  get cartTotal(): number {
    return this.cartItemsSubject.value.reduce((total, item) => {
      return total + (item.product?.price || 0) * item.quantity;
    }, 0);
  }

  // Get cart subtotal (before any discounts/taxes)
  get cartSubtotal(): number {
    return this.cartItemsSubject.value.reduce((total, item) => {
      return total + (item.product?.price || 0) * item.quantity;
    }, 0);
  }

  // Check if cart is empty
  get isCartEmpty(): boolean {
    return this.cartItemsSubject.value.length === 0;
  }

  // Refresh cart from server
  refreshCart(): void {
    this.loadCart();
  }

  private loadCart(): void {
    this.getCart().subscribe({
      next: (response) => {
        if (response.success) {
          this.cartItemsSubject.next(response.data);
        }
      },
      error: (error) => {
        console.error('Error loading cart:', error);
      }
    });
  }

  // Helper method to update local cart state after operations
  private updateLocalCart(): void {
    this.getCart().subscribe({
      next: (response) => {
        if (response.success) {
          this.cartItemsSubject.next(response.data);
        }
      }
    });
  }
}