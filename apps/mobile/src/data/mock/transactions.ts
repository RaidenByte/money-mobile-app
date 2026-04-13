import { Transaction } from '../../types';

export const mockTransactions: Transaction[] = [
  {
    id: 't1',
    amount: 12800,
    type: 'income',
    categoryId: 'c1',
    date: '2026-04-01',
    note: '4月工资',
  },
  {
    id: 't2',
    amount: 68,
    type: 'expense',
    categoryId: 'c4',
    date: '2026-04-02',
    note: '午饭',
  },
  {
    id: 't3',
    amount: 25,
    type: 'expense',
    categoryId: 'c5',
    date: '2026-04-03',
    note: '地铁',
  },
  {
    id: 't4',
    amount: 399,
    type: 'expense',
    categoryId: 'c6',
    date: '2026-04-04',
    note: '日用品',
  },
  {
    id: 't5',
    amount: 180,
    type: 'expense',
    categoryId: 'c8',
    date: '2026-04-05',
    note: '电影+晚餐',
  },
];
