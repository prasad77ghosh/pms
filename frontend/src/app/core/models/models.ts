export interface User {
    id: number;
    name: string;
    email: string;
    role: 'admin' | 'user';
    avatar?: string;
}

export interface Category {
    id: number;
    name: string;
    description?: string;
}

export interface Product {
    id: number;
    name: string;
    description: string;
    price: number;
    categoryId: number;
    categoryName?: string;
    imageUrl?: string;
    stock: number;
}

export interface AuthResponse {
    token: string;
    user: User;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
}
