import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { ProductService } from '../../../core/services/product.service';
import { Product, ProductFilters } from '../../../core/models/product.model';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.css']
})
export class ProductListComponent implements OnInit, OnDestroy {
  products: Product[] = [];
  categories: string[] = [];
  isLoading = false;
  searchTerm = '';
  selectedCategory = '';
  priceRange = { min: 0, max: 1000 };
  
  // Pagination
  currentPage = 1;
  itemsPerPage = 12;
  totalProducts = 0;
  totalPages = 0;
  
  private searchTerms = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor(
    private productService: ProductService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadProducts();
    this.loadCategories();
    
    // Setup search debounce
    this.searchTerms.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(term => {
      this.searchTerm = term;
      this.currentPage = 1;
      this.loadProducts();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadProducts(): void {
    this.isLoading = true;
    
    const filters: ProductFilters = {
      page: this.currentPage,
      limit: this.itemsPerPage,
      ...(this.searchTerm && { search: this.searchTerm }),
      ...(this.selectedCategory && { category: this.selectedCategory }),
      ...(this.priceRange.min && { minPrice: this.priceRange.min }),
      ...(this.priceRange.max && { maxPrice: this.priceRange.max })
    };

    this.productService.getProducts(filters).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.products = response.data.products;
          this.totalProducts = response.data.total;
          this.totalPages = Math.ceil(this.totalProducts / this.itemsPerPage);
        } else {
          console.error('Failed to load products:', response.message);
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error loading products:', error);
      }
    });
  }

  loadCategories(): void {
    this.productService.getCategories().subscribe({
      next: (response) => {
        if (response.success) {
          this.categories = response.data;
        }
      },
      error: (error) => {
        console.error('Error loading categories:', error);
      }
    });
  }

  onSearch(term: string): void {
    this.searchTerms.next(term);
  }

  onCategoryChange(category: string): void {
    this.selectedCategory = category;
    this.currentPage = 1;
    this.loadProducts();
  }

  onPriceRangeChange(): void {
    this.currentPage = 1;
    this.loadProducts();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedCategory = '';
    this.priceRange = { min: 0, max: 1000 };
    this.currentPage = 1;
    this.loadProducts();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadProducts();
    window.scrollTo(0, 0);
  }

  viewProduct(productId: string): void {
    this.router.navigate(['/products', productId]);
  }

  addToCart(product: Product): void {
    // TODO: Implement cart service
    console.log('Add to cart:', product);
    alert(`${product.name} added to cart!`);
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  get showingStart(): number {
    return (this.currentPage - 1) * this.itemsPerPage + 1;
  }

  get showingEnd(): number {
    return Math.min(this.currentPage * this.itemsPerPage, this.totalProducts);
  }
}