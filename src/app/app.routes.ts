import { Routes } from '@angular/router';
import { authGuard } from './guards/auth-guard';

export const routes: Routes = [
  { 
    path: 'login',
    loadComponent: () => import('./pages/login/login').then(m => m.Login)
  },
  { 
    path: 'inicio', 
    loadComponent: () => import('./pages/dashboard/dashboard').then(m => m.Dashboard),
    canActivate: [authGuard] 
  },
  { 
    path: 'request', 
    loadComponent: () => import('./pages/request/request').then(m => m.RequestComponent),
    canActivate: [authGuard] 
  },
  {
    path: 'clients',
    loadComponent: () => import('./pages/client/client').then(m => m.ClientsComponent),
    canActivate: [authGuard]
  },
  { 
    path: '', 
    redirectTo: 'login', 
    pathMatch: 'full' 
  },
  { 
    path: '**', 
    redirectTo: 'login' 
  }
];