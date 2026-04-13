import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TransactionsService } from './transactions.service';

describe('TransactionsService', () => {
  const prisma = {
    transaction: {
      findMany: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    category: {
      findFirst: jest.fn(),
    },
  } as any;

  let service: TransactionsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new TransactionsService(prisma);
  });

  it('list should normalize date to YYYY-MM-DD', async () => {
    prisma.transaction.findMany.mockResolvedValue([
      {
        id: 't1',
        amount: 88,
        type: 'expense',
        categoryId: 'c1',
        note: '午饭',
        date: new Date('2026-04-11T08:00:00.000Z'),
      },
    ]);

    const rows = await service.list('u1');
    expect(rows[0].date).toBe('2026-04-11');
  });

  it('create should throw when category not found in current user', async () => {
    prisma.category.findFirst.mockResolvedValue(null);

    await expect(
      service.create('u1', {
        amount: 10,
        type: 'expense',
        categoryId: 'c-not-exists',
        date: '2026-04-11',
        note: '',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('update should throw when transaction does not exist', async () => {
    prisma.transaction.findFirst.mockResolvedValue(null);

    await expect(
      service.update('u1', 't404', {
        amount: 10,
        type: 'expense',
        categoryId: 'c1',
        date: '2026-04-11',
        note: '',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('remove should delete transaction when exists', async () => {
    prisma.transaction.findFirst.mockResolvedValue({ id: 't1' });
    prisma.transaction.delete.mockResolvedValue({ id: 't1' });

    const result = await service.remove('u1', 't1');
    expect(result).toEqual({ success: true });
    expect(prisma.transaction.delete).toHaveBeenCalledWith({ where: { id: 't1' } });
  });
});
