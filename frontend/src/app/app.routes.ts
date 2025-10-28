import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { RolesGuard } from './core/guards/roles.guard';

export const routes: Routes = [
  { 
    path: 'auth', 
    loadChildren: () => import('./auth/auth.routes').then(m => m.AUTH_ROUTES) 
  },
  { 
    path: 'products', 
    loadChildren: () => import('./products/products.routes').then(m => m.PRODUCT_ROUTES) 
  },
  { 
    path: 'cart', 
    loadChildren: () => import('./cart/cart.routes').then(m => m.CART_ROUTES),
    canActivate: [AuthGuard] 
  },
  { 
    path: 'orders', 
    loadChildren: () => import('./orders/orders.routes').then(m => m.ORDER_ROUTES),
    canActivate: [AuthGuard] 
  },
  { 
    path: 'profile', 
    loadChildren: () => import('./profile/profile.routes').then(m => m.PROFILE_ROUTES),
    canActivate: [AuthGuard] 
  },
  { 
    path: 'admin', 
    canActivate: [AuthGuard, RolesGuard],
    data: { roles: ['ADMIN'] },
    loadChildren: () => import('./admin/admin.routes').then(m => m.ADMIN_ROUTES)
  },
  { path: '', redirectTo: '/products', pathMatch: 'full' },
  { path: '**', redirectTo: '/products' }
];