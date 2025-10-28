import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { ProductService } from '../../../core/services/product.service';
import { CartService } from '../../../core/services/cart.service';
import { Product } from '../../../core/models/product.model';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.css']
})
export class ProductDetailComponent implements OnInit, OnDestroy {
  product: Product | null = null;
  recommendedProducts: Product[] = [];
  isLoading = true;
  quantity = 1;
  activeImageIndex = 0;
  
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private cartService: CartService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const productId = params.get('id');
      if (productId) {
        this.loadProduct(productId);
        this.loadRecommendedProducts(productId);
      } else {
        this.router.navigate(['/products']);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadProduct(productId: string): void {
    this.isLoading = true;
    this.productService.getProductById(productId).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.product = response.data;
        } else {
          console.error('Failed to load product:', response.message);
          this.router.navigate(['/products']);
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error loading product:', error);
        this.router.navigate(['/products']);
      }
    });
  }

  loadRecommendedProducts(productId: string): void {
    // For now, we'll load products from the same category
    // Later we can implement a proper recommendation service
    this.productService.getProducts({ limit: 4 }).subscribe({
      next: (response) => {
        if (response.success) {
          // Filter out the current product and take up to 4 recommendations
          this.recommendedProducts = response.data.products
            .filter(p => p.id !== productId)
            .slice(0, 4);
        }
      },
      error: (error) => {
        console.error('Error loading recommended products:', error);
      }
    });
  }

  addToCart(): void {
    if (!this.product) return;

    this.cartService.addToCart(this.product.id, this.quantity).subscribe({
      next: (response) => {
        if (response.success) {
          alert(`${this.product!.name} added to cart!`);
          this.quantity = 1; // Reset quantity
        } else {
          alert('Failed to add product to cart: ' + response.message);
        }
      },
      error: (error) => {
        console.error('Error adding to cart:', error);
        alert('Error adding product to cart. Please try again.');
      }
    });
  }

  increaseQuantity(): void {
    if (this.product && this.quantity < this.product.stock) {
      this.quantity++;
    }
  }

  decreaseQuantity(): void {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  setImageIndex(index: number): void {
    this.activeImageIndex = index;
  }

  get stockStatus(): string {
    if (!this.product) return '';
    
    if (this.product.stock === 0) {
      return 'Out of Stock';
    } else if (this.product.stock <= this.product.lowStockThreshold) {
      return 'Low Stock';
    } else {
      return 'In Stock';
    }
  }

  get stockStatusClass(): string {
    if (!this.product) return '';
    
    if (this.product.stock === 0) {
      return 'out-of-stock';
    } else if (this.product.stock <= this.product.lowStockThreshold) {
      return 'low-stock';
    } else {
      return 'in-stock';
    }
  }

  get isOutOfStock(): boolean {
    return this.product?.stock === 0;
  }
}