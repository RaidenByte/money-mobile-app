import { TransactionType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, Matches, Min } from 'class-validator';

export class UpsertTransactionDto {
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: '金额格式不正确' })
  @Min(0.01, { message: '金额必须大于 0' })
  amount!: number;

  @IsEnum(TransactionType, { message: '类型必须是 income 或 expense' })
  type!: TransactionType;

  @IsString()
  categoryId!: string;

  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: '日期格式必须是 YYYY-MM-DD' })
  date!: string;

  @IsOptional()
  @IsString()
  note?: string;
}
