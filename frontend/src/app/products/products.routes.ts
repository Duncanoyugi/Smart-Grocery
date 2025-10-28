import { Routes } from '@angular/router';

export const PRODUCT_ROUTES: Routes = [
  { 
    path: '', 
    loadComponent: () => import('./pages/product-list/product-list.component').then(m => m.ProductListComponent) 
  },
  { 
    path: ':id', 
    loadComponent: () => import('./pages/product-detail/product-detail.component').then(m => m.ProductDetailComponent) 
  }
];