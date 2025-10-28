import { Routes } from '@angular/router';

export const ORDER_ROUTES: Routes = [
  { 
    path: 'checkout', 
    loadComponent: () => import('./checkout/checkout.component').then(m => m.CheckoutComponent) 
  },
  { 
    path: 'my-orders', 
    loadComponent: () => import('./orders-list/orders-list.component').then(m => m.OrdersListComponent) 
  },
  { path: '', redirectTo: 'my-orders', pathMatch: 'full' }
];