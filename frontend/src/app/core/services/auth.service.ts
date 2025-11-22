import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, LoginRequest, User } from '../models/models';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private apiUrl = `${environment.apiUrl}/auth`;
    private readonly TOKEN_KEY = 'auth_token';
    private readonly USER_KEY = 'auth_user';

    // Signals for reactive state
    currentUser = signal<User | null>(this.getUserFromStorage());
    isAuthenticated = computed(() => !!this.currentUser());

    constructor(private http: HttpClient, private router: Router) { }

    login(credentials: LoginRequest): Observable<AuthResponse> {
        // Mocking login for UI demonstration if backend is not reachable
        // In a real app, this would be: return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(...)

        // MOCK IMPLEMENTATION
        const mockResponse: AuthResponse = {
            token: 'mock-jwt-token-12345',
            user: {
                id: 1,
                name: 'Demo Admin',
                email: credentials.email,
                role: 'admin',
                avatar: 'https://ui-avatars.com/api/?name=Demo+Admin'
            }
        };

        return of(mockResponse).pipe(
            tap(response => {
                this.setSession(response);
            })
        );
    }

    logout(): void {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.USER_KEY);
        this.currentUser.set(null);
        this.router.navigate(['/auth/login']);
    }

    getToken(): string | null {
        return localStorage.getItem(this.TOKEN_KEY);
    }

    private setSession(authResult: AuthResponse): void {
        localStorage.setItem(this.TOKEN_KEY, authResult.token);
        localStorage.setItem(this.USER_KEY, JSON.stringify(authResult.user));
        this.currentUser.set(authResult.user);
        this.router.navigate(['/products']);
    }

    private getUserFromStorage(): User | null {
        const userStr = localStorage.getItem(this.USER_KEY);
        return userStr ? JSON.parse(userStr) : null;
    }
}
