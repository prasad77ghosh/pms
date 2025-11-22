import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, User } from '../models/models';

export interface CreateUserRequest {
    name: string;
    email: string;
    password: string;
    role: 'admin' | 'user';
}

export interface UpdateUserRequest {
    name?: string;
    email?: string;
    role?: 'admin' | 'user';
}

export interface UserListParams {
    page?: number;
    limit?: number;
    search?: string;
    role?: 'admin' | 'user';
}

export interface UserListResponse {
    page: number;
    limit: number;
    total: number;
    data: User[];
}

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private apiUrl = `${environment.apiUrl}/user`;

    constructor(private http: HttpClient) { }

    /**
     * Create a new user
     * POST /api/v1/user/add
     */
    createUser(data: CreateUserRequest): Observable<ApiResponse<User>> {
        return this.http.post<ApiResponse<User>>(`${this.apiUrl}/add`, data).pipe(
            catchError(error => {
                console.error('Create user error:', error);
                return throwError(() => error);
            })
        );
    }

    /**
     * Get a single user by ID
     * GET /api/v1/user/:id
     */
    getUser(id: string): Observable<ApiResponse<User>> {
        return this.http.get<ApiResponse<User>>(`${this.apiUrl}/${id}`).pipe(
            catchError(error => {
                console.error('Get user error:', error);
                return throwError(() => error);
            })
        );
    }

    /**
     * List users with pagination, search, and role filter
     * GET /api/v1/user
     */
    listUsers(params: UserListParams = {}): Observable<ApiResponse<UserListResponse>> {
        let httpParams = new HttpParams();

        if (params.page) httpParams = httpParams.set('page', params.page.toString());
        if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
        if (params.search) httpParams = httpParams.set('search', params.search);
        if (params.role) httpParams = httpParams.set('role', params.role);

        return this.http.get<ApiResponse<UserListResponse>>(this.apiUrl, { params: httpParams }).pipe(
            catchError(error => {
                console.error('List users error:', error);
                return throwError(() => error);
            })
        );
    }

    /**
     * Update a user
     * PUT /api/v1/user/:id
     */
    updateUser(id: string, data: UpdateUserRequest): Observable<ApiResponse<User>> {
        return this.http.put<ApiResponse<User>>(`${this.apiUrl}/${id}`, data).pipe(
            catchError(error => {
                console.error('Update user error:', error);
                return throwError(() => error);
            })
        );
    }

    /**
     * Delete a user
     * DELETE /api/v1/user/:id
     */
    deleteUser(id: string): Observable<ApiResponse<void>> {
        return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`).pipe(
            catchError(error => {
                console.error('Delete user error:', error);
                return throwError(() => error);
            })
        );
    }
}
