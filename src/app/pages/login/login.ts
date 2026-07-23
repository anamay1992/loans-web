import { Component, inject } from '@angular/core';
import { Supabase } from '../../services/supabase/supabase';
import { ToastService } from '../../services/toast/toast'; // <-- Traemos las notificaciones

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private supabase = inject(Supabase);
  private toast = inject(ToastService); // Inyectamos el servicio

  async loginWithGoogle() {
    try {
      // Supabase tomará el control, enviará el usuario a Google
      // y Google lo devolverá a '/inicio' automáticamente.
      await this.supabase.signInWithGoogle();
      
    } catch (error) {
      console.error('Error en el pacto con Google:', error);
      // Reemplazamos el alert() aburrido por nuestra notificación de error
      this.toast.show('Las fuerzas oscuras impidieron la conexión.', 'error');
    }
  }
}