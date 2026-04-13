export type TransactionType = 'income' | 'expense';

export interface User {
  id: string;
  name: string;
  phone: string;
}

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
}

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  date: string;
  note: string;
}

export interface MonthlyReport {
  income: number;
  expense: number;
  balance: number;
  incomeBreakdown: Array<{
    categoryId: string;
    categoryName: string;
    total: number;
    percent: number;
  }>;
  expenseBreakdown: Array<{
    categoryId: string;
    categoryName: string;
    total: number;
    percent: number;
  }>;
}
