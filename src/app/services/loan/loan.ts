import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Installment {
  id: number;
  sequence: number;
  amount: number;
  principal: number;
  interest: number;
  balance: number;
  dueDate: string;
  status: string;
}

export interface Loan {
  id: number;
  clientId: number;
  clientName?: string;
  capital: number;
  rate: number;
  installments?: number;
  paymentFrequency?: string;
  originalMonths?: number; 
  systemType?: string;
  startDate: string;
  endDate: string;
  totalEarned: number;
  status: string;
}

export interface Client {
  id: number;
  document: string;
  fullName: string;
  phoneNumber: string;
  email: string | null;
  status: string;
}

export interface CreateLoanRequest {
  clientId: number | null;
  startDate: string;             // ← Agregado
  capital: number | null;
  systemType: string;            // ← Agregado
  rate: number;
  originalMonths: number | null; // ← Agregado
}

export interface UpdateClientRequest {
  id: number;
  fullName: string;
  phoneNumber: string;
  email: string | null;
}

export interface CreateClientRequest {
  document: string;
  fullName: string;
  phoneNumber: string;
  email: string | null;
}

export interface PaymentRequest {
  loanId: number;
  installmentId: number;
  amountPaid: number;
  processType: string;
  strategyType?: string;
}

@Injectable({
  providedIn: 'root'
})
export class LoanService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl

  getLoans(): Observable<Loan[]> {
    return this.http.get<Loan[]>(`${this.apiUrl}/loans`);
  }

  createLoan(loanData: CreateLoanRequest): Observable<Loan> {
    return this.http.post<Loan>(`${this.apiUrl}/loans`, loanData);
  }

  getInstallmentsByLoanId(loanId: number): Observable<Installment[]> {
    return this.http.get<Installment[]>(`${this.apiUrl}/installments/${loanId}`);
  }

  pagarCuota(paymentData: PaymentRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/payments`, paymentData);
  }

  getClients(): Observable<Client[]> {
    return this.http.get<Client[]>(`${this.apiUrl}/clients`);
  }

  crearCliente(clientData: CreateClientRequest): Observable<Client> {
    return this.http.post<Client>(`${this.apiUrl}/clients`, clientData);
  }

  actualizarCliente(clientData: UpdateClientRequest): Observable<Client> {
    // Optimización: El ID viaja dentro del payload (clientData) y no en la URL
    return this.http.put<Client>(`${this.apiUrl}/clients`, clientData);
  }
}