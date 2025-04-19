// filepath: /angular-app/src/app/interceptors/auth.interceptor.ts
import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler } from '@angular/common/http';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
    constructor(private authService: AuthService) {}

    intercept(req: HttpRequest<any>, next: HttpHandler) {
        const token = this.authService.getToken();
        if (token) {
            const cloned = req.clone({
                setHeaders: {
                    Authorization: token,
                },
            });
            return next.handle(cloned);
        }
        return next.handle(req);
    }
}