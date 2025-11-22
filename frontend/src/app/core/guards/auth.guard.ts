import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    return authService.checkAuth().pipe(
        map(isAuthenticated => {
            if (isAuthenticated) {
                return true;
            }

            // Redirect to login page with return url
            return router.createUrlTree(['/auth/login'], { queryParams: { returnUrl: state.url } });
        })
    );
};
