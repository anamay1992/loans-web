import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { Supabase } from '../services/supabase/supabase';

export const authGuard: CanActivateFn = async (): Promise<boolean | UrlTree> => {
  const router = inject(Router);
  const supabaseService = inject(Supabase);

  try {
    const session = await supabaseService.getSession();

    return session ? true : router.createUrlTree(['/login']);
    
  } catch (error) {
    console.error('Error verificando la sesión:', error);
    return router.createUrlTree(['/login']);
  }
};