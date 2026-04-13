import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TransactionType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertTransactionDto } from './dto/upsert-transaction.dto';

const toDate = (value: string) => new Date(`${value}T00:00:00.000Z`);

const toOutput = (item: {
  id: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  note: string;
  date: Date;
}) => ({
  id: item.id,
  amount: item.amount,
  type: item.type,
  categoryId: item.categoryId,
  note: item.note,
  date: item.date.toISOString().slice(0, 10),
});

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string) {
    const rows = await this.prisma.transaction.findMany({
      where: { userId },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        amount: true,
        type: true,
        categoryId: true,
        note: true,
        date: true,
      },
    });

    return rows.map((item) => toOutput(item));
  }

  async create(userId: string, dto: UpsertTransactionDto) {
    await this.ensureCategory(userId, dto.categoryId, dto.type);

    const created = await this.prisma.transaction.create({
      data: {
        userId,
        amount: dto.amount,
        type: dto.type,
        categoryId: dto.categoryId,
        date: toDate(dto.date),
        note: (dto.note ?? '').trim(),
      },
      select: {
        id: true,
        amount: true,
        type: true,
        categoryId: true,
        note: true,
        date: true,
      },
    });

    return toOutput(created);
  }

  async update(userId: string, id: string, dto: UpsertTransactionDto) {
    const existing = await this.prisma.transaction.findFirst({
      where: { id, userId },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('记录不存在');
    }

    await this.ensureCategory(userId, dto.categoryId, dto.type);

    const updated = await this.prisma.transaction.update({
      where: { id },
      data: {
        amount: dto.amount,
        type: dto.type,
        categoryId: dto.categoryId,
        date: toDate(dto.date),
        note: (dto.note ?? '').trim(),
      },
      select: {
        id: true,
        amount: true,
        type: true,
        categoryId: true,
        note: true,
        date: true,
      },
    });

    return toOutput(updated);
  }

  async remove(userId: string, id: string) {
    const existing = await this.prisma.transaction.findFirst({
      where: { id, userId },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('记录不存在');
    }

    await this.prisma.transaction.delete({ where: { id } });
    return { success: true };
  }

  private async ensureCategory(userId: string, categoryId: string, type: TransactionType) {
    const category = await this.prisma.category.findFirst({
      where: { id: categoryId, userId },
      select: { id: true, type: true },
    });

    if (!category) {
      throw new BadRequestException('分类不存在或无权限');
    }

    if (category.type !== type) {
      throw new BadRequestException('分类类型与收支类型不匹配');
    }
  }
}
