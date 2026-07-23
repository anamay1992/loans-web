import { Component, inject, OnInit, signal, computed } from '@angular/core';
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
  
  // 🦇 SEÑALES PARA LOS FILTROS VISUALES
  searchQuery = signal<string>('');
  selectedStatusFilter = signal<string>('ALL'); // 'ALL', 'ACTIVE', 'SETTLED'

  // 🦇 SEÑALES DE PAGINACIÓN
  currentPage = signal<number>(1);
  pageSize = 6; // Máximo 6 pactos por página

  // 🦇 SEÑAL COMPUTADA QUE FILTRA POR NOMBRE Y ESTADO EN TIEMPO REAL
  loansFiltrados = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const statusFilter = this.selectedStatusFilter();
    const lista = this.loans();
    
    return lista.filter(loan => {
      const nombre = (loan.clientName || 'Alma Anónima').toLowerCase();
      const coincideNombre = nombre.includes(query);
      const coincideEstado = statusFilter === 'ALL' || loan.status === statusFilter;
      return coincideNombre && coincideEstado;
    });
  });

  // 🦇 TOTAL DE PÁGINAS CALCULADAS AUTOMÁTICAMENTE
  totalPages = computed(() => {
    const total = this.loansFiltrados().length;
    return Math.ceil(total / this.pageSize) || 1;
  });

  // 🦇 ARRAY DE NÚMEROS DE PÁGINA PARA LOS BOTONES
  pagesArray = computed(() => {
    const total = this.totalPages();
    return Array.from({ length: total }, (_, i) => i + 1);
  });

  // 🦇 CORTE DE REGISTROS SEGÚN LA PÁGINA ACTUAL (MÁXIMO 6)
  loansPaginados = computed(() => {
    const lista = this.loansFiltrados();
    const page = this.currentPage();
    const start = (page - 1) * this.pageSize;
    return lista.slice(start, start + this.pageSize);
  });

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
        // 🦇 Ordenados por fecha de inicio (startDate) del más antiguo al más reciente
        const prestamosOrdenados = datosQueLlegan.sort((a, b) => {
          const fechaA = new Date(a.startDate).getTime();
          const fechaB = new Date(b.startDate).getTime();
          
          return fechaA - fechaB; // Si prefieres del más reciente al más antiguo, cambia a: fechaB - fechaA
        });

        this.loans.set(prestamosOrdenados);
      },
      error: (error) => {
        console.error('Error al obtener los préstamos:', error);
        this.toast.show('Las fuerzas oscuras ocultaron los registros.', 'error');
      }
    });
  }

  // Métodos para resetear la página a 1 cuando el usuario busca o filtra
  onSearchInput(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.searchQuery.set(val);
    this.currentPage.set(1);
  }

  onStatusChange(event: Event) {
    const val = (event.target as HTMLSelectElement).value;
    this.selectedStatusFilter.set(val);
    this.currentPage.set(1);
  }

  // Métodos de navegación de páginas
  cambiarPagina(delta: number) {
    const nuevaPagina = this.currentPage() + delta;
    if (nuevaPagina >= 1 && nuevaPagina <= this.totalPages()) {
      this.currentPage.set(nuevaPagina);
    }
  }

  irAPagina(pagina: number) {
    if (pagina >= 1 && pagina <= this.totalPages()) {
      this.currentPage.set(pagina);
    }
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

  aplicarLiquidacionTotal(inst: Installment) {
    const montoTotalLiquidacion = inst.amount + inst.balance;
    this.amountPaidInput.set(Number(montoTotalLiquidacion.toFixed(2)));
    this.processTypeInput.set('REGULAR');
    this.strategyTypeInput.set('REDUCE_TERM');
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
