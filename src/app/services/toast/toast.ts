import { Injectable, signal } from '@angular/core';

export interface ToastMessage {
  message: string;
  type: 'success' | 'error' | 'warning';
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  currentToast = signal<ToastMessage | null>(null);

  show(message: string, type: 'success' | 'error' | 'warning') {
    this.currentToast.set({ message, type });
    
    setTimeout(() => {
      this.currentToast.set(null);
    }, 3500);
  }
}
