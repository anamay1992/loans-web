import { Injectable, signal } from '@angular/core';
import { createClient, SupabaseClient, Session } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class Supabase {
  private supabase: SupabaseClient;

  public activeSession = signal<Session | null>(null);
  
  private isSessionLoaded = false;

  constructor() {
    console.log('Variables de entorno cargadas:', environment);
    this.supabase = createClient(environment.authUrl, environment.authKey);

    this.supabase.auth.onAuthStateChange((event, session) => {
      this.activeSession.set(session);
      this.isSessionLoaded = true;
    });
  }

  async signInWithGoogle() {
    const { data, error } = await this.supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/inicio` // <-- Dinámico para local y Vercel
      }
    });
    
    if (error) {
      console.error('Error al iniciar sesión:', error.message);
      throw error;
    }
    return data;
  }

  async signOut() {
    const { error } = await this.supabase.auth.signOut();
    if (error) {
      console.error('Error cerrando sesión:', error.message);
    }
  }

  async getOptimizedSession(): Promise<Session | null> {
    if (this.isSessionLoaded) {
      return this.activeSession();
    }

    const { data, error } = await this.supabase.auth.getSession();
    
    if (error) {
      console.error('Error obteniendo la sesión de base:', error);
      return null;
    }

    this.activeSession.set(data.session);
    this.isSessionLoaded = true;
    return data.session;
  }

  async getSession() {
    return this.getOptimizedSession();
  }

  async getSessionToken(): Promise<string | null> {
    let session = this.activeSession();

    if (!session) {
      const { data, error } = await this.supabase.auth.getSession();
      if (error) {
        console.error('Error obteniendo la sesión:', error);
        return null;
      }
      session = data.session;
    }

    if (!session) {
      const refreshed = await this.supabase.auth.refreshSession();
      session = refreshed.data?.session;
    }

    return session?.access_token || null;
  }
}