import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
    const router = inject(Router);

    // Clone request with credentials to include httpOnly cookies
    const clonedReq = req.clone({
        withCredentials: true
    });

    return next(clonedReq).pipe(
        catchError((error: HttpErrorResponse) => {
            if (error.status === 401) {
                // Unauthorized - redirect to login
                router.navigate(['/auth/login']);
            }
            return throwError(() => error);
        })
    );
};
