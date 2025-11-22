import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
    ApiResponse,
    LoginRequest,
    LoginResponse,
    RegisterRequest,
    User
} from '../models/models';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private apiUrl = `${environment.apiUrl}/auth`;

    // Signals for reactive state
    currentUser = signal<User | null>(null);
    isAuthenticated = computed(() => !!this.currentUser());

    constructor(private http: HttpClient, private router: Router) {
        // Try to fetch profile on initialization
        this.initializeAuth();
    }

    private initializeAuth(): void {
        // Check if we have a valid session by trying to fetch profile
        this.getProfile().subscribe({
            next: (user) => {
                this.currentUser.set(user);
            },
            error: () => {
                // No valid session, user is not authenticated
                this.currentUser.set(null);
            }
        });
    }

    login(credentials: LoginRequest): Observable<LoginResponse> {
        return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials).pipe(
            tap(response => {
                if (response.success) {
                    // Fetch user profile after successful login
                    this.getProfile().subscribe({
                        next: (user) => {
                            this.currentUser.set(user);
                            this.router.navigate(['/products']);
                        },
                        error: (error) => {
                            console.error('Failed to fetch profile after login:', error);
                        }
                    });
                }
            }),
            catchError(error => {
                console.error('Login error:', error);
                return throwError(() => error);
            })
        );
    }

    register(data: RegisterRequest): Observable<ApiResponse<User>> {
        return this.http.post<ApiResponse<User>>(`${this.apiUrl}/register`, data).pipe(
            tap(response => {
                if (response.success && response.data) {
                    // After registration, user needs to login
                    this.router.navigate(['/auth/login']);
                }
            }),
            catchError(error => {
                console.error('Registration error:', error);
                return throwError(() => error);
            })
        );
    }

    logout(): Observable<ApiResponse<void>> {
        return this.http.post<ApiResponse<void>>(`${this.apiUrl}/logout`, {}).pipe(
            tap(() => {
                this.currentUser.set(null);
                this.router.navigate(['/auth/login']);
            }),
            catchError(error => {
                // Even if logout fails, clear local state
                this.currentUser.set(null);
                this.router.navigate(['/auth/login']);
                return throwError(() => error);
            })
        );
    }

    getProfile(): Observable<User> {
        return this.http.get<ApiResponse<User>>(`${this.apiUrl}/profile`).pipe(
            tap(response => {
                if (response.success && response.data) {
                    this.currentUser.set(response.data);
                }
            }),
            catchError(error => {
                console.error('Get profile error:', error);
                return throwError(() => error);
            }),
            // Extract the user data from the response
            map(response => response.data as User)
        );
    }

    refreshToken(): Observable<ApiResponse<void>> {
        return this.http.post<ApiResponse<void>>(`${this.apiUrl}/refresh`, {}).pipe(
            catchError(error => {
                console.error('Token refresh error:', error);
                // If refresh fails, logout
                this.currentUser.set(null);
                this.router.navigate(['/auth/login']);
                return throwError(() => error);
            })
        );
    }

    // Legacy method for compatibility - no longer stores token locally
    getToken(): string | null {
        return null; // Cookies are handled automatically
    }
}
