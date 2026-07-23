import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common'; 
import { LoanService, Loan, Installment, PaymentRequest } from '../../services/loan/loan';
import { ToastService } from '../../services/toast/toast'; 
import { Supabase } from '../../services/supabase/supabase'; 

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, CommonModule], 
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {
  private loanService = inject(LoanService);
  private router = inject(Router);
  private toast = inject(ToastService);
  private supabase = inject(Supabase);

  loans = signal<Loan[]>([]);
  installments = signal<Installment[]>([]);
  
  selectedLoanId = signal<number | null>(null);
  showModal = signal<boolean>(false);
  loadingInstallments = signal<boolean>(false);

  selectedInstallment = signal<Installment | null>(null);
  showPaymentModal = signal<boolean>(false);
  amountPaidInput = signal<number>(0);
  processTypeInput = signal<string>('REGULAR');
  strategyTypeInput = signal<string>('REDUCE_TERM');
  isPaying = signal<boolean>(false);

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos() {
    this.loanService.getLoans().subscribe({
      next: (datosQueLlegan) => {
        this.loans.set(datosQueLlegan);
      },
      error: (error) => {
        console.error('Error al obtener los préstamos:', error);
        this.toast.show('Las fuerzas oscuras ocultaron los registros.', 'error');
      }
    });
  }

  verCuotas(loanId: number) {
    this.selectedLoanId.set(loanId);
    this.loadingInstallments.set(true);
    this.showModal.set(true);

    this.loanService.getInstallmentsByLoanId(loanId).subscribe({
      next: (data) => {
        const cuotasOrdenadas = data.sort((a, b) => a.sequence - b.sequence);
        this.installments.set(cuotasOrdenadas);
        this.loadingInstallments.set(false);
      },
      error: (err) => {
        console.error('Error al obtener las cuotas:', err);
        this.toast.show('No se pudieron revelar las cuotas del alma.', 'error');
        this.loadingInstallments.set(false);
      }
    });
  }

  cerrarModal() {
    this.showModal.set(false);
    this.installments.set([]);
    this.selectedLoanId.set(null);
  }

  abrirModalPago(inst: Installment) {
    this.selectedInstallment.set(inst);
    this.amountPaidInput.set(inst.amount);
    this.processTypeInput.set('REGULAR');
    this.strategyTypeInput.set('REDUCE_TERM');
    this.showPaymentModal.set(true);
  }

  cerrarModalPago() {
    this.showPaymentModal.set(false);
    this.selectedInstallment.set(null);
  }

  getLoanStatusText(status: string): string {
    switch (status?.toUpperCase()) {
      case 'ACTIVE': return 'EN PROCESO';
      case 'SETTLED': return 'CANCELADO';
      case 'CLOSED': return 'CERRADO';
      default: return status;
    }
  }

  getInstallmentStatusText(status: string): string {
    switch (status?.toUpperCase()) {
      case 'PAID': return 'PAGADO';
      case 'PENDING': return 'PENDIENTE';
      default: return status;
    }
  }

  onAmountChange(event: Event) {
    const val = Number((event.target as HTMLInputElement).value);
    this.amountPaidInput.set(val);

    const inst = this.selectedInstallment();
    if (!inst) return;

    if (val === inst.interest) {
      this.processTypeInput.set('INTEREST_ONLY');
    }
  }

  debeForzarInterestOnly(): boolean {
    const inst = this.selectedInstallment();
    if (!inst) return false;
    return Number(this.amountPaidInput()) === inst.interest;
  }

  debeHabilitarEstrategia(): boolean {
    const inst = this.selectedInstallment();
    if (!inst) return false;
    const val = Number(this.amountPaidInput());
    return this.processTypeInput() === 'REGULAR' && val > inst.amount;
  }

  ejecutarPago() {
    const inst = this.selectedInstallment();
    const loanId = this.selectedLoanId();
    if (!inst || !loanId) return;

    const val = Number(this.amountPaidInput());

    if (val === inst.interest && this.processTypeInput() !== 'INTEREST_ONLY') {
      this.toast.show('Si el monto equivale al interés, exige proceso SOLO INTERÉS.', 'warning');
      return;
    } 
    
    if (val < inst.interest) {
      this.toast.show('El tributo ingresado es menor al interés exigido.', 'warning');
      return;
    }

    this.isPaying.set(true);

    const payload: PaymentRequest = {
      loanId: loanId,
      installmentId: inst.id,
      amountPaid: val,
      processType: this.processTypeInput()
    };

    if (this.debeHabilitarEstrategia()) {
      payload.strategyType = this.strategyTypeInput();
    }

    this.loanService.pagarCuota(payload).subscribe({
      next: () => {
        this.toast.show('Tributo recolectado con éxito.', 'success');
        this.isPaying.set(false);
        this.cerrarModalPago();
        this.verCuotas(loanId);
        this.cargarDatos(); 
      },
      error: (err) => {
        console.error('Error al registrar el pago:', err);
        this.toast.show('Fallo al reclamar el pago en el servidor.', 'error');
        this.isPaying.set(false);
      }
    });
  }
  
  async logout() {
    try {
      await this.supabase.signOut();
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Error al cerrar el grimorio:', error);
      this.toast.show('No se pudo cerrar la conexión astral.', 'error');
    }
  }
}