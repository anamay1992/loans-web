import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LoanService, Client, CreateClientRequest, UpdateClientRequest } from '../../services/loan/loan';
import { ToastService } from '../../services/toast/toast';

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './client.html',
  styleUrl: './client.css' // Si tienes estilos adicionales
})
export class ClientsComponent implements OnInit {
  private loanService = inject(LoanService);
  private toast = inject(ToastService);

  clients = signal<Client[]>([]);
  isLoading = signal<boolean>(true);

  showModal = signal<boolean>(false);
  isEditing = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);

  clientId = signal<number | null>(null);
  documento = signal<string>('');
  fullName = signal<string>('');
  phoneNumber = signal<string>('');
  email = signal<string>('');

  ngOnInit() {
    this.cargarAlmas();
  }

  cargarAlmas() {
    this.isLoading.set(true);
    this.loanService.getClients().subscribe({
      next: (data) => {
        // Ordenamos alfabéticamente
        const ordenados = data.sort((a, b) => a.fullName.localeCompare(b.fullName));
        this.clients.set(ordenados);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error al invocar almas:', err);
        this.toast.show('Las fuerzas oscuras ocultaron el directorio.', 'error');
        this.isLoading.set(false);
      }
    });
  }

  // --- CONTROL DEL MODAL ---

  abrirModalCrear() {
    this.isEditing.set(false);
    this.limpiarFormulario();
    this.showModal.set(true);
  }

  abrirModalEditar(client: Client) {
    this.isEditing.set(true);
    this.clientId.set(client.id);
    this.documento.set(client.document);
    this.fullName.set(client.fullName);
    this.phoneNumber.set(client.phoneNumber);
    this.email.set(client.email || ''); // Manejo de nulos
    this.showModal.set(true);
  }

  cerrarModal() {
    this.showModal.set(false);
    this.limpiarFormulario();
  }

  limpiarFormulario() {
    this.clientId.set(null);
    this.documento.set('');
    this.fullName.set('');
    this.phoneNumber.set('');
    this.email.set('');
  }

  guardarAlma() {
    if (!this.documento().trim() || !this.fullName().trim() || !this.phoneNumber().trim()) {
      this.toast.show('Documento, Nombre y Teléfono son obligatorios para el pacto.', 'warning');
      return;
    }

    this.isSubmitting.set(true);

    if (this.isEditing()) {
      const payload: UpdateClientRequest = {
        id: this.clientId()!,
        fullName: this.fullName(),
        phoneNumber: this.phoneNumber(),
        email: this.email() || null
      };

      this.loanService.actualizarCliente(payload).subscribe({
        next: () => {
          this.toast.show('Registros del alma actualizados con éxito.', 'success');
          this.finalizarGuardado();
        },
        error: (err) => {
          console.error('Error al actualizar:', err);
          this.toast.show('El grimorio rechazó la actualización.', 'error');
          this.isSubmitting.set(false);
        }
      });

    } else {
      const payload: CreateClientRequest = {
        document: this.documento(),
        fullName: this.fullName(),
        phoneNumber: this.phoneNumber(),
        email: this.email() || null
      };

      this.loanService.crearCliente(payload).subscribe({
        next: () => {
          this.toast.show('Nueva alma encadenada al sistema.', 'success');
          this.finalizarGuardado();
        },
        error: (err) => {
          console.error('Error al crear:', err);
          this.toast.show('El ritual de invocación ha fallado.', 'error');
          this.isSubmitting.set(false);
        }
      });
    }
  }

  private finalizarGuardado() {
    this.isSubmitting.set(false);
    this.cerrarModal();
    this.cargarAlmas();
  }
}
