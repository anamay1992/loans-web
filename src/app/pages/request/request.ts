import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LoanService, Client } from '../../services/loan/loan';
import { ToastService } from '../../services/toast/toast'; 

@Component({
  selector: 'app-request',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './request.html'
})
export class RequestComponent implements OnInit {
  private loanService = inject(LoanService);
  private toast = inject(ToastService);
  private router = inject(Router);

  clients = signal<Client[]>([]);
  isLoadingClients = signal<boolean>(true);
  isSubmitting = signal<boolean>(false);

  clientId = signal<number | null>(null);
  startDate = signal<string>(new Date().toISOString().split('T')[0]); // Fecha actual por defecto
  capital = signal<number | null>(null);
  systemType = signal<string>('FRENCH'); // Sistema por defecto
  rate = signal<number>(10); // 10% por defecto
  originalMonths = signal<number | null>(null);

  ngOnInit() {
    this.cargarClientes();
  }

  cargarClientes() {
    this.loanService.getClients().subscribe({
      next: (data) => {
        const ordenados = data.sort((a, b) => a.fullName.localeCompare(b.fullName));
        this.clients.set(ordenados);
        this.isLoadingClients.set(false);
      },
      error: (err) => {
        console.error('Error invocando clientes:', err);
        this.toast.show('No se pudieron invocar las almas del servidor.', 'error');
        this.isLoadingClients.set(false);
      }
    });
  }

  forjarPacto() {
    if (!this.clientId()) {
      this.toast.show('Debes seleccionar un alma (cliente) para el pacto.', 'warning');
      return;
    }
    if (!this.startDate()) {
      this.toast.show('La fecha del pacto es obligatoria.', 'warning');
      return;
    }
    if (!this.capital() || this.capital()! <= 0) {
      this.toast.show('El capital (tributo) debe ser mayor a 0.', 'warning');
      return;
    }
    if (this.rate() < 0) {
      this.toast.show('La tasa de usura no puede ser negativa.', 'warning');
      return;
    }
    if (!this.originalMonths() || this.originalMonths()! <= 0) {
      this.toast.show('El número de cuotas (meses) debe ser al menos 1.', 'warning');
      return;
    }

    this.isSubmitting.set(true);

    const payload = {
      clientId: this.clientId(),
      startDate: this.startDate(),
      capital: this.capital(),
      systemType: this.systemType(),
      rate: this.rate(),
      originalMonths: this.originalMonths()
    };

    console.log('Enviando pacto al backend:', payload);

    this.loanService.createLoan(payload).subscribe({
      next: () => {
        this.toast.show('Pacto de sangre forjado con éxito.', 'success');
        this.isSubmitting.set(false);
        this.router.navigate(['/inicio']); 
      },
      error: (err) => {
        console.error('Error al forjar:', err);
        this.toast.show('Las fuerzas oscuras impidieron registrar el pacto.', 'error');
        this.isSubmitting.set(false);
      }
    });
  }
}