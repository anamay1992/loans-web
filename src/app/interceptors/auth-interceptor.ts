import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const supabaseKey = 'sb-swicihavhudhzfhelkrm-auth-token';
  const sessionData = localStorage.getItem(supabaseKey);

  if (sessionData) {
    try {
      const session = JSON.parse(sessionData);
      
      const accessToken = session.access_token;

      if (accessToken) {
        const authReq = req.clone({
          setHeaders: {
            Authorization: `Bearer ${accessToken}`
          }
        });
        return next(authReq);
      }
    } catch (error) {
      console.error('Error al procesar la sesión de Supabase:', error);
    }
  }

  return next(req);
};