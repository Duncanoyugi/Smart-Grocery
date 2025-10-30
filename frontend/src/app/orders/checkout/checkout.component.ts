import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { CartService } from '../../core/services/cart.service';
import { OrderService } from '../../core/services/order.service';
import { AuthService } from '../../core/services/auth.service';
import { CartItem } from '../../core/models/cart.model';
import { User } from '../../core/models/user.model';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css']
})
export class CheckoutComponent implements OnInit, OnDestroy {
  checkoutForm: FormGroup;
  cartItems: CartItem[] = [];
  currentUser: User | null = null;
  isLoading = true;
  isSubmitting = false;
  paymentMethods = ['credit_card', 'debit_card', 'paypal'];
  selectedPaymentMethod = 'credit_card';
  
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private cartService: CartService,
    private orderService: OrderService,
    private authService: AuthService,
    private router: Router
  ) {
    this.checkoutForm = this.createCheckoutForm();
  }

  ngOnInit(): void {
    this.loadCartItems();
    this.loadCurrentUser();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  createCheckoutForm(): FormGroup {
    return this.fb.group({
      // Shipping Information
      shippingFirstName: ['', [Validators.required, Validators.minLength(2)]],
      shippingLastName: ['', [Validators.required, Validators.minLength(2)]],
      shippingAddress: ['', [Validators.required, Validators.minLength(5)]],
      shippingCity: ['', [Validators.required]],
      shippingState: ['', [Validators.required]],
      shippingZipCode: ['', [Validators.required, Validators.pattern(/^\d{5}(-\d{4})?$/)]],
      shippingPhone: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],

      // Billing Information (same as shipping by default)
      sameAsShipping: [true],
      billingFirstName: [''],
      billingLastName: [''],
      billingAddress: [''],
      billingCity: [''],
      billingState: [''],
      billingZipCode: [''],

      // Payment Information
      cardNumber: ['', [Validators.required, Validators.pattern(/^\d{16}$/)]],
      cardExpiry: ['', [Validators.required, Validators.pattern(/^(0[1-9]|1[0-2])\/\d{2}$/)]],
      cardCVC: ['', [Validators.required, Validators.pattern(/^\d{3,4}$/)]],
      cardName: ['', [Validators.required]],

      // Order Notes
      orderNotes: ['']
    });
  }

  loadCartItems(): void {
    this.cartService.cartItems$
      .pipe(takeUntil(this.destroy$))
      .subscribe(items => {
        this.cartItems = items;
        this.isLoading = false;
        
        if (this.isCartEmpty) {
          this.router.navigate(['/cart']);
        }
      });
  }

  loadCurrentUser(): void {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
        if (user) {
          this.prefillUserData(user);
        }
      });
  }

  prefillUserData(user: User): void {
    const nameParts = user.name.split(' ');
    this.checkoutForm.patchValue({
      shippingFirstName: nameParts[0] || '',
      shippingLastName: nameParts.slice(1).join(' ') || '',
      billingFirstName: nameParts[0] || '',
      billingLastName: nameParts.slice(1).join(' ') || '',
      cardName: user.name
    });
  }

  onSameAsShippingChange(): void {
    const sameAsShipping = this.checkoutForm.get('sameAsShipping')?.value;
    
    if (sameAsShipping) {
      this.checkoutForm.patchValue({
        billingFirstName: this.checkoutForm.get('shippingFirstName')?.value,
        billingLastName: this.checkoutForm.get('shippingLastName')?.value,
        billingAddress: this.checkoutForm.get('shippingAddress')?.value,
        billingCity: this.checkoutForm.get('shippingCity')?.value,
        billingState: this.checkoutForm.get('shippingState')?.value,
        billingZipCode: this.checkoutForm.get('shippingZipCode')?.value
      });
    } else {
      this.checkoutForm.patchValue({
        billingFirstName: '',
        billingLastName: '',
        billingAddress: '',
        billingCity: '',
        billingState: '',
        billingZipCode: ''
      });
    }
  }

  onSubmit(): void {
    if (this.checkoutForm.invalid) {
      this.markFormGroupTouched();
      alert('Please fill in all required fields correctly.');
      return;
    }

    if (this.isCartEmpty) {
      alert('Your cart is empty. Please add items before checking out.');
      return;
    }

    this.isSubmitting = true;

    const orderData = {
      items: this.cartItems.map(item => ({
        productId: item.productId,
        quantity: item.quantity
      })),
      shippingAddress: this.getShippingAddress(),
      billingAddress: this.getBillingAddress(),
      paymentMethod: this.selectedPaymentMethod,
      notes: this.checkoutForm.get('orderNotes')?.value
    };

    this.orderService.createOrder(orderData).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        if (response.success) {
          // Clear cart and redirect to order confirmation
          this.cartService.clearCart().subscribe();
          this.router.navigate(['/orders/confirmation'], {
            queryParams: { orderId: response.data.id }
          });
        } else {
          alert('Failed to place order: ' + response.message);
        }
      },
      error: (error) => {
        this.isSubmitting = false;
        console.error('Error placing order:', error);
        alert('Error placing order. Please try again.');
      }
    });
  }

  getShippingAddress(): any {
    const form = this.checkoutForm;
    return {
      firstName: form.get('shippingFirstName')?.value,
      lastName: form.get('shippingLastName')?.value,
      address: form.get('shippingAddress')?.value,
      city: form.get('shippingCity')?.value,
      state: form.get('shippingState')?.value,
      zipCode: form.get('shippingZipCode')?.value,
      phone: form.get('shippingPhone')?.value
    };
  }

  getBillingAddress(): any {
    const form = this.checkoutForm;
    return {
      firstName: form.get('billingFirstName')?.value,
      lastName: form.get('billingLastName')?.value,
      address: form.get('billingAddress')?.value,
      city: form.get('billingCity')?.value,
      state: form.get('billingState')?.value,
      zipCode: form.get('billingZipCode')?.value
    };
  }

  markFormGroupTouched(): void {
    Object.keys(this.checkoutForm.controls).forEach(key => {
      this.checkoutForm.get(key)?.markAsTouched();
    });
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
    return this.cartSubtotal > 50 ? 0 : 5.99;
  }

  get taxAmount(): number {
    return this.cartSubtotal * 0.085;
  }

  get grandTotal(): number {
    return this.cartSubtotal + this.shippingCost + this.taxAmount;
  }

  // Form field getters for easy access in template
  get shippingFirstName() { return this.checkoutForm.get('shippingFirstName'); }
  get shippingLastName() { return this.checkoutForm.get('shippingLastName'); }
  get shippingAddress() { return this.checkoutForm.get('shippingAddress'); }
  get shippingCity() { return this.checkoutForm.get('shippingCity'); }
  get shippingState() { return this.checkoutForm.get('shippingState'); }
  get shippingZipCode() { return this.checkoutForm.get('shippingZipCode'); }
  get shippingPhone() { return this.checkoutForm.get('shippingPhone'); }
  get cardNumber() { return this.checkoutForm.get('cardNumber'); }
  get cardExpiry() { return this.checkoutForm.get('cardExpiry'); }
  get cardCVC() { return this.checkoutForm.get('cardCVC'); }
  get cardName() { return this.checkoutForm.get('cardName'); }
}