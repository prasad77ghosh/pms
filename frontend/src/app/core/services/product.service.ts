import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, Product, ProductListResponse } from '../models/models';

export interface CreateProductRequest {
    name: string;
    price: number;
    image_url?: string;
    category_id: string;
}

export interface UpdateProductRequest {
    name?: string;
    price?: number;
    image_url?: string;
    category_id?: string;
}

export interface ProductListParams {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    sort?:
    | 'name_asc'
    | 'name_desc'
    | 'price_asc'
    | 'price_desc'
    | 'created_at_asc'
    | 'created_at_desc'
    | 'category_asc'
    | 'category_desc';
}

@Injectable({
    providedIn: 'root'
})
export class ProductService {
    private apiUrl = `${environment.apiUrl}/product`;

    constructor(private http: HttpClient) { }

    /**
     * Create a new product
     * POST /api/v1/product/add
     */
    createProduct(data: CreateProductRequest): Observable<ApiResponse<Product>> {
        return this.http.post<ApiResponse<Product>>(`${this.apiUrl}/add`, data).pipe(
            catchError(error => {
                console.error('Create product error:', error);
                return throwError(() => error);
            })
        );
    }

    /**
     * Get a single product by ID
     * GET /api/v1/product/:id
     */
    getProduct(id: string): Observable<ApiResponse<Product>> {
        return this.http.get<ApiResponse<Product>>(`${this.apiUrl}/${id}`).pipe(
            catchError(error => {
                console.error('Get product error:', error);
                return throwError(() => error);
            })
        );
    }

    /**
     * List products with pagination, search, filter, and sort
     * GET /api/v1/product
     */
    listProducts(params: ProductListParams = {}): Observable<ApiResponse<ProductListResponse>> {
        let httpParams = new HttpParams();

        if (params.page) httpParams = httpParams.set('page', params.page.toString());
        if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
        if (params.search) httpParams = httpParams.set('search', params.search);
        if (params.category) httpParams = httpParams.set('category', params.category);
        if (params.sort) httpParams = httpParams.set('sort', params.sort);

        return this.http.get<ApiResponse<ProductListResponse>>(this.apiUrl, { params: httpParams }).pipe(
            catchError(error => {
                console.error('List products error:', error);
                return throwError(() => error);
            })
        );
    }

    /**
     * Update a product
     * PUT /api/v1/product/:id
     */
    updateProduct(id: string, data: UpdateProductRequest): Observable<ApiResponse<Product>> {
        return this.http.put<ApiResponse<Product>>(`${this.apiUrl}/${id}`, data).pipe(
            catchError(error => {
                console.error('Update product error:', error);
                return throwError(() => error);
            })
        );
    }

    /**
     * Delete a product
     * DELETE /api/v1/product/:id
     */
    deleteProduct(id: string): Observable<ApiResponse<void>> {
        return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`).pipe(
            catchError(error => {
                console.error('Delete product error:', error);
                return throwError(() => error);
            })
        );
    }
}
