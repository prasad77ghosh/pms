import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, Category, CategoryListResponse } from '../models/models';

export interface CreateCategoryRequest {
    name: string;
}

export interface UpdateCategoryRequest {
    name?: string;
}

export interface CategoryListParams {
    page?: number;
    limit?: number;
    search?: string;
}

@Injectable({
    providedIn: 'root'
})
export class CategoryService {
    private apiUrl = `${environment.apiUrl}/category`;

    constructor(private http: HttpClient) { }

    /**
     * Create a new category
     * POST /api/v1/category/add
     */
    createCategory(data: CreateCategoryRequest): Observable<ApiResponse<Category>> {
        return this.http.post<ApiResponse<Category>>(`${this.apiUrl}/add`, data).pipe(
            catchError(error => {
                console.error('Create category error:', error);
                return throwError(() => error);
            })
        );
    }

    /**
     * Get a single category by ID
     * GET /api/v1/category/:id
     */
    getCategory(id: string): Observable<ApiResponse<Category>> {
        return this.http.get<ApiResponse<Category>>(`${this.apiUrl}/${id}`).pipe(
            catchError(error => {
                console.error('Get category error:', error);
                return throwError(() => error);
            })
        );
    }

    /**
     * List categories with pagination and search
     * GET /api/v1/category
     */
    listCategories(params: CategoryListParams = {}): Observable<ApiResponse<CategoryListResponse>> {
        let httpParams = new HttpParams();

        if (params.page) httpParams = httpParams.set('page', params.page.toString());
        if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
        if (params.search) httpParams = httpParams.set('search', params.search);

        return this.http.get<ApiResponse<CategoryListResponse>>(this.apiUrl, { params: httpParams }).pipe(
            catchError(error => {
                console.error('List categories error:', error);
                return throwError(() => error);
            })
        );
    }

    /**
     * Update a category
     * PUT /api/v1/category/:id
     */
    updateCategory(id: string, data: UpdateCategoryRequest): Observable<ApiResponse<Category>> {
        return this.http.put<ApiResponse<Category>>(`${this.apiUrl}/${id}`, data).pipe(
            catchError(error => {
                console.error('Update category error:', error);
                return throwError(() => error);
            })
        );
    }

    /**
     * Delete a category
     * DELETE /api/v1/category/:id
     */
    deleteCategory(id: string): Observable<ApiResponse<void>> {
        return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`).pipe(
            catchError(error => {
                console.error('Delete category error:', error);
                return throwError(() => error);
            })
        );
    }
}
