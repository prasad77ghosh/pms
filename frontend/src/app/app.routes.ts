import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';
import { AuthLayoutComponent } from './layouts/auth-layout/auth-layout.component';

export const routes: Routes = [
    {
        path: 'auth',
        component: AuthLayoutComponent,
        children: [
            {
                path: 'login',
                loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
            },
            { path: '', redirectTo: 'login', pathMatch: 'full' }
        ]
    },
    {
        path: '',
        component: MainLayoutComponent,
        // Removed authGuard from the root of MainLayout to allow public access to Products List
        children: [
            { path: '', redirectTo: 'auth/login', pathMatch: 'full' },
            {
                path: 'products',
                children: [
                    { path: '', loadComponent: () => import('./features/products/list/product-list.component').then(m => m.ProductListComponent) },
                    // Protected Routes
                    {
                        path: 'create',
                        loadComponent: () => import('./features/products/create/product-form.component').then(m => m.ProductFormComponent),
                        canActivate: [authGuard]
                    },
                    {
                        path: 'edit/:id',
                        loadComponent: () => import('./features/products/create/product-form.component').then(m => m.ProductFormComponent),
                        canActivate: [authGuard]
                    }
                ]
            },
            {
                path: 'categories',
                canActivate: [authGuard], // Protect all category routes
                children: [
                    { path: '', loadComponent: () => import('./features/categories/list/category-list.component').then(m => m.CategoryListComponent) },
                    { path: 'create', loadComponent: () => import('./features/categories/create/category-form.component').then(m => m.CategoryFormComponent) },
                    { path: 'edit/:id', loadComponent: () => import('./features/categories/create/category-form.component').then(m => m.CategoryFormComponent) }
                ]
            },
            {
                path: 'users',
                canActivate: [authGuard], // Protect all user routes
                children: [
                    { path: '', loadComponent: () => import('./features/users/list/user-list.component').then(m => m.UserListComponent) },
                    { path: 'create', loadComponent: () => import('./features/users/create/user-form.component').then(m => m.UserFormComponent) },
                    { path: 'edit/:id', loadComponent: () => import('./features/users/create/user-form.component').then(m => m.UserFormComponent) }
                ]
            },
            {
                path: 'bulk-upload',
                loadComponent: () => import('./features/bulk-upload/bulk-upload.component').then(m => m.BulkUploadComponent),
                canActivate: [authGuard]
            },
            {
                path: 'reports',
                loadComponent: () => import('./features/reports/reports.component').then(m => m.ReportsComponent),
                canActivate: [authGuard]
            }
        ]
    },
    { path: '**', redirectTo: '' }
];
