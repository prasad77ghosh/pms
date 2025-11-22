// Backend API Response Wrapper
export interface ApiResponse<T> {
    success: boolean;
    msg: string;
    data?: T;
}

// User model matching backend
export interface User {
    id: string | number; // UUID from backend or number for mock data
    name: string;
    email: string;
    role?: 'admin' | 'user';
    created_at?: string;
    updated_at?: string;
}

// Category model matching backend
export interface Category {
    id: string | number; // UUID from backend or number for mock data
    name: string;
    description?: string;
    created_at?: string;
    updated_at?: string;
}

// Product model matching backend
export interface Product {
    id: string | number; // UUID from backend or number for mock data
    name: string;
    description?: string;
    price: number;
    image_url?: string;
    imageUrl?: string; // For compatibility with existing frontend code
    category_id?: string | number;
    categoryId?: number; // For compatibility with existing frontend code
    category_name?: string; // From JOIN query
    categoryName?: string; // For compatibility with existing frontend code
    stock?: number;
    created_at?: string;
}

// Auth related interfaces
export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
}

// Backend uses cookies, no token in response
export interface LoginResponse {
    success: boolean;
    msg: string;
}

export interface AuthResponse {
    token: string; // For compatibility with existing code
    user: User;
}

// Generic paginated response from backend
export interface PaginatedResponse<T> {
    page: number;
    limit: number;
    data?: T[]; // For generic use
    products?: T[]; // Specific for product list
}

// Product list specific response (adds total count)
export interface ProductListResponse {
    page: number;
    limit: number;
    total: number;
    products: Product[];
}

// Category list specific response
export interface CategoryListResponse {
    page: number;
    limit: number;
    total: number;
    data: Category[];
}

// Bulk upload response
export interface BulkUploadResponse {
    jobId: string;
    chunks: number;
    persistence: 'db' | 'rmq';
}
