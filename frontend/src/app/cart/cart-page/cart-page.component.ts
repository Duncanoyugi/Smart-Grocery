import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { CartService } from '../../core/services/cart.service';
import { CartItem } from '../../core/models/cart.model';

@Component({
  selector: 'app-cart-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './cart-page.component.html',
  styleUrls: ['./cart-page.component.css']
})
export class CartPageComponent implements OnInit, OnDestroy {
  cartItems: CartItem[] = [];
  isLoading = true;
  isUpdating = false;
  
  private destroy$ = new Subject<void>();

  constructor(
    private cartService: CartService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCartItems();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadCartItems(): void {
    this.isLoading = true;
    this.cartService.cartItems$
      .pipe(takeUntil(this.destroy$))
      .subscribe(items => {
        this.cartItems = items;
        this.isLoading = false;
      });
  }

  updateQuantity(cartItem: CartItem, newQuantity: number): void {
    if (newQuantity < 1) return;
    if (newQuantity > (cartItem.product?.stock || 0)) {
      alert(`Only ${cartItem.product?.stock} units available`);
      return;
    }

    this.isUpdating = true;
    this.cartService.updateCartItem(cartItem.id, newQuantity).subscribe({
      next: (response) => {
        this.isUpdating = false;
        if (!response.success) {
          alert('Failed to update quantity: ' + response.message);
        }
      },
      error: (error) => {
        this.isUpdating = false;
        console.error('Error updating quantity:', error);
        alert('Error updating quantity. Please try again.');
      }
    });
  }

  removeItem(cartItemId: string): void {
    if (!confirm('Are you sure you want to remove this item from your cart?')) {
      return;
    }

    this.isUpdating = true;
    this.cartService.removeFromCart(cartItemId).subscribe({
      next: (response) => {
        this.isUpdating = false;
        if (!response.success) {
          alert('Failed to remove item: ' + response.message);
        }
      },
      error: (error) => {
        this.isUpdating = false;
        console.error('Error removing item:', error);
        alert('Error removing item. Please try again.');
      }
    });
  }

  clearCart(): void {
    if (!confirm('Are you sure you want to clear your entire cart?')) {
      return;
    }

    this.isUpdating = true;
    this.cartService.clearCart().subscribe({
      next: (response) => {
        this.isUpdating = false;
        if (!response.success) {
          alert('Failed to clear cart: ' + response.message);
        }
      },
      error: (error) => {
        this.isUpdating = false;
        console.error('Error clearing cart:', error);
        alert('Error clearing cart. Please try again.');
      }
    });
  }

  proceedToCheckout(): void {
    this.router.navigate(['/orders/checkout']);
  }

  continueShopping(): void {
    this.router.navigate(['/products']);
  }

  get cartTotal(): number {
    return this.cartService.cartTotal;
  }

  get cartSubtotal(): number {
    return this.cartService.cartSubtotal;
  }

  get cartItemCount(): number {
    return this.cartService.cartItemCount;
  }

  get isCartEmpty(): boolean {
    return this.cartService.isCartEmpty;
  }

  get shippingCost(): number {
    // Free shipping for orders over $50, otherwise $5.99
    return this.cartSubtotal > 50 ? 0 : 5.99;
  }

  get taxAmount(): number {
    // 8.5% tax rate
    return this.cartSubtotal * 0.085;
  }

  get grandTotal(): number {
    return this.cartSubtotal + this.shippingCost + this.taxAmount;
  }
}