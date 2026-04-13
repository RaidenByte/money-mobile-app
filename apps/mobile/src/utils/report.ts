import { Category, MonthlyReport, Transaction } from '../types';

export const toMonthKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

export const filterTransactionsByMonth = (transactions: Transaction[], monthKey: string) =>
  transactions.filter((tx) => tx.date.slice(0, 7) === monthKey);

const buildTypeBreakdown = (
  transactions: Transaction[],
  categories: Category[],
  type: 'income' | 'expense',
  totalBase: number,
) => {
  const totalsByCategory = transactions
    .filter((tx) => tx.type === type)
    .reduce<Record<string, number>>((acc, tx) => {
      acc[tx.categoryId] = (acc[tx.categoryId] ?? 0) + tx.amount;
      return acc;
    }, {});

  return Object.entries(totalsByCategory)
    .map(([categoryId, total]) => {
      const categoryName =
        categories.find((category) => category.id === categoryId)?.name ?? '未分类';
      const percent = totalBase > 0 ? total / totalBase : 0;
      return { categoryId, categoryName, total, percent };
    })
    .sort((a, b) => b.total - a.total);
};

export const buildMonthlyReport = (
  transactions: Transaction[],
  categories: Category[],
  monthKey: string = toMonthKey(new Date()),
): MonthlyReport => {
  const monthlyTransactions = filterTransactionsByMonth(transactions, monthKey);

  const income = monthlyTransactions
    .filter((tx) => tx.type === 'income')
    .reduce((sum, tx) => sum + tx.amount, 0);
  const expense = monthlyTransactions
    .filter((tx) => tx.type === 'expense')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const incomeBreakdown = buildTypeBreakdown(monthlyTransactions, categories, 'income', income);
  const expenseBreakdown = buildTypeBreakdown(monthlyTransactions, categories, 'expense', expense);

  return {
    income,
    expense,
    balance: income - expense,
    incomeBreakdown,
    expenseBreakdown,
  };
};
