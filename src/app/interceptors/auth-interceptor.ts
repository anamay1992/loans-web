import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { Supabase } from '../services/supabase/supabase';
import { ToastService } from '../services/toast/toast';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const supabase = inject(Supabase);
  const toast = inject(ToastService);

  const supabaseKey = 'sb-swicihavhudhzfhelkrm-auth-token';
  const sessionData = localStorage.getItem(supabaseKey);

  let authReq = req;

  if (sessionData) {
    try {
      const session = JSON.parse(sessionData);
      const accessToken = session.access_token;

      if (accessToken) {
        authReq = req.clone({
          setHeaders: {
            Authorization: `Bearer ${accessToken}`
          }
        });
      }
    } catch (error) {
      console.error('Error al procesar la sesión de Supabase:', error);
    }
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        console.warn('El token ha expirado o el acceso ha sido denegado.');
        
        supabase.signOut().finally(() => {
          localStorage.removeItem(supabaseKey);
          router.navigate(['/login']);
          toast.show('Tu sesión ha expirado en las sombras. Inicia sesión de nuevo.', 'error');
        });
      }
      return throwError(() => error);
    })
  );
};