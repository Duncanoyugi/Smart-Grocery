import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  { 
    path: 'dashboard', 
    loadComponent: () => import('../analytics/dashboard/dashboard.component').then(m => m.DashboardComponent) 
  },
  { 
    path: 'products', 
    loadComponent: () => import('../products/admin/product-list-admin/product-list-admin.component').then(m => m.ProductListAdminComponent) 
  },
  { 
    path: 'inventory', 
    loadComponent: () => import('../inventory/inventory-page/inventory-page.component').then(m => m.InventoryPageComponent) 
  },
  { 
    path: 'orders', 
    loadComponent: () => import('../orders/admin/orders-admin/orders-admin.component').then(m => m.OrdersAdminComponent) 
  },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
];